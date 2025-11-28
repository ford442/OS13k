// Initialize PeerJS
const peer = new Peer(); // Client doesn't need a specific ID
let conn = null;

const connectBtn = document.getElementById('connectBtn');
const peerIdInput = document.getElementById('peerIdInput');
const statusEl = document.getElementById('status');
const trackpad = document.getElementById('trackpad');

// Connection logic
connectBtn.addEventListener('click', () => {
    const destId = peerIdInput.value.trim();
    if (!destId) return;

    statusEl.textContent = 'Status: Connecting...';
    connectBtn.disabled = true;

    conn = peer.connect(destId);

    conn.on('open', () => {
        statusEl.textContent = 'Status: Connected to ' + destId;
        statusEl.style.color = '#0f0';
        trackpad.textContent = 'SWIPE TO MOVE\nTAP TO CLICK';
    });

    conn.on('close', () => {
        statusEl.textContent = 'Status: Disconnected';
        statusEl.style.color = '#aaa';
        connectBtn.disabled = false;
        trackpad.textContent = 'TOUCH AREA';
        conn = null;
    });

    conn.on('error', (err) => {
        statusEl.textContent = 'Error: ' + err;
        connectBtn.disabled = false;
    });
});

peer.on('error', (err) => {
    console.error(err);
    statusEl.textContent = 'Peer Error: ' + err.type;
});

// Touch Logic
let lastX = 0;
let lastY = 0;
let isDown = false;
let tapStartTime = 0;

trackpad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        isDown = true;
        tapStartTime = Date.now();
    }
}, { passive: false });

trackpad.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!conn || !conn.open) return;
    if (e.touches.length > 0) {
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;

        const dx = x - lastX;
        const dy = y - lastY;

        conn.send({ type: 'move', dx, dy });

        lastX = x;
        lastY = y;
    }
}, { passive: false });

trackpad.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDown = false;

    // Detect Tap
    const duration = Date.now() - tapStartTime;
    if (duration < 200 && conn && conn.open) {
        conn.send({ type: 'click' });
    }
});
