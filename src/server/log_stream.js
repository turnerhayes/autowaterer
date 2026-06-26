// =============================================================================
// log_stream.js — ESP32 UDP multicast log receiver for Express
//
// Attaches three routes to your existing Express app under a configurable
// mount path, and starts a UDP multicast listener.
//
// Usage:
//   import { attachLogger } from './log_stream.js';
//   attachLogger(app, { mountPath: '/logs' });
//
// Routes mounted:
//   GET <mountPath>/         → browser log viewer (HTML)
//   GET <mountPath>/stream   → SSE live feed
//   GET <mountPath>/history  → JSON ring buffer dump
// =============================================================================

const fs = require('node:fs');
const dgram = require('node:dgram');
const { Router } = require('express');
const cors = require('cors');
const { addEntries, getEntries, clearEntriesBefore } = require('./persistence/logs');

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
    mountPath:     '/logs',
    multicastIP:   '239.255.0.1',
    multicastPort: 9999,
    bindIface:     '0.0.0.0',
    historyLimit:  500,
    wsl2bridge:    false,
};

let _viewerHTML = null;

function viewerHTML() {
    if (_viewerHTML == null) {
        _viewerHTML = fs.readFileSync("./stream_viewer.html", {
            encoding: "utf-8",
        });
    }

    return _viewerHTML;
}

// ── attachLogger(app, options) ────────────────────────────────────────────────
// Call once after your Express app is created, before app.listen().
module.exports.attachLogger = function(app, userOptions = {}) {
    const opts = { ...DEFAULTS, ...userOptions };

    const store  = createStore(opts.historyLimit);
    const router = createRouter(store);

    app.use(opts.mountPath, router);
    startUdp(opts, store);

    console.log(`[logger] routes mounted at ${opts.mountPath}`);
    return router;
}

// ── Store: ring buffer + SSE client registry ──────────────────────────────────
function createStore(limit) {
    const history = [];
    const clients = new Set();

    getEntries().then((entries) => {
        history.unshift(...entries);
    });

    let entriesToPersist = [];

    function broadcast(entry) {
        history.push(entry);
        entriesToPersist.push(entry);
        if (history.length > limit) history.shift();

        const payload = `${JSON.stringify({
            data: entry,
        })}\n\n`;
        for (const res of clients) res.write(payload);
    }

    setInterval(async () => {
        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        try {
            const numRemoved = await clearEntriesBefore({
                cutoffDate,
            });

            if (numRemoved > 0) {
                console.log("Removed %d log entries from before %s", numRemoved, cutoffDate.toISOString());
            }
        }
        catch (ex) {
            console.error("Error trying to remove old log entries:", ex);
        }
    }, 1000 * 60 * 60 * 24); // once every 24 hours

    setInterval(async () => {
        if (entriesToPersist.length > 0) {
            const entries = [...entriesToPersist];
            entriesToPersist = [];
            try {
                const addCount = await addEntries({
                    entries,
                });
                console.log("persisted %d log entries", addCount);
            }
            catch (ex) {
                console.error("Error persisting log entries:", ex);
                entriesToPersist.unshift(...entries);
            }
        }
    }, 10_000);

    return { history, clients, broadcast };
}

// ── Express router ────────────────────────────────────────────────────────────
function createRouter({ history, clients, broadcast }) {
    const router = Router();

    router.use(cors());

    // SSE live feed
    router.get('/stream', (req, res) => {
        res.set({
            'Content-Type':      'text/event-stream',
            'Cache-Control':     'no-cache',
            'Connection':        'keep-alive',
            'X-Accel-Buffering': 'no',    // prevent Nginx from buffering SSE
        });
        res.flushHeaders();

        // Replay history so a fresh page load is immediately populated.
        for (const entry of history) {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        }

        const keepalive = setInterval(() => res.write(': keepalive\n\n'), 15_000);

        clients.add(res);
        console.log(`[logger/sse] client connected (${clients.size} total)`);

        req.on('close', () => {
            clearInterval(keepalive);
            clients.delete(res);
            console.log(`[logger/sse] client disconnected (${clients.size} remaining)`);
        });
    });

    // JSON history dump — useful for curl / server-side consumers
    router.get('/history', (_req, res) => {
        res.json(history);
    });

    // Browser viewer
    router.get('/', (_req, res) => {
        res.type('html').send(viewerHTML());
    });

    return router;
}

// ── UDP multicast receiver ────────────────────────────────────────────────────
function startUdp({ multicastIP, multicastPort, bindIface, wsl2bridge }, { broadcast }) {
    if (wsl2bridge) {
        bindIface = "127.0.0.1";
    }
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('error', (err) => {
        console.error('[logger/udp] error:', err.message);
    });

    socket.on('message', (buf, rinfo) => {
        const raw = buf.toString('utf8').trim();
        if (!raw) return;

        const entry = parseLine(raw, rinfo.address);
        if (entry == null) {
            return;
        }
        // console.log(formatForTerminal(entry));
        broadcast(entry);
    });

    socket.bind(multicastPort, bindIface, () => {
        const iface = bindIface === '0.0.0.0' ? undefined : bindIface;
        socket.addMembership(multicastIP, iface);
        console.log(`[logger/udp] joined ${multicastIP}:${multicastPort}`);
    });

    return socket;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseLine(raw, source) {
    // const match = raw.match(/^\[(\w+)\s+([^\]]+)\]\s*(.*)/s);
    if (raw.indexOf(",") < 0) {
        console.error("Invalid log entry line:", raw);
        return null;
    }
    const [level, timestampStr, ...msgParts] = raw.split(",");
    const message = msgParts.join(",");
    let ms, timestamp;
    if (timestampStr.endsWith("ms")) {
        const msStr = timestampStr.substring(0, timestampStr.length - 2);
        ms = Number(msStr);
        if (Number.isNaN(ms)) {
            console.error(`Millisecond offset string ${msStr} is not a valid number`);
            ms = null;
        }
    }
    else {
        timestamp = Number(timestampStr);

        if (Number.isNaN(timestamp)) {
            console.error(`Entry timestamp ${timestampStr} is not a valid number`);
            timestamp = null;
        }
    }


    return {
        receivedAt: Date.now(),
        source,
        level,
        timestamp: timestamp * 1000, // Convert Unix -> JS timestamp
        ms,
        message,
        raw,
    };
}

const ANSI = {
    DEBUG: '\x1b[90m', INFO: '\x1b[32m', WARN: '\x1b[33m', ERROR: '\x1b[31m', RESET: '\x1b[0m',
};
function formatForTerminal({ level, timestamp, ms, message, source }) {
    const ts = ms == null ? new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour12: false }) : `${ms}ms`;
    return `${ANSI[level] ?? ''}[${level.padEnd(5)} ${ts}] ${message} (from ${source})${ANSI.RESET}`;
}
