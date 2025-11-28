
// OS13k Bridge for Phone Controller
// Handles PeerJS connection and fake cursor simulation

(function() {
    console.log('Initializing OS13k Bridge...');

    // 1. Create UI for Connection ID
    const statusDiv = document.createElement('div');
    statusDiv.style.position = 'absolute';
    statusDiv.style.top = '10px';
    statusDiv.style.right = '10px';
    statusDiv.style.zIndex = '100000';
    statusDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    statusDiv.style.color = '#0f0';
    statusDiv.style.padding = '10px';
    statusDiv.style.border = '2px solid #0f0';
    statusDiv.style.fontFamily = 'monospace';
    statusDiv.innerHTML = 'Initializing Bridge...';
    document.body.appendChild(statusDiv);

    // 2. Create Fake Cursor
    const cursor = document.createElement('div');
    cursor.style.position = 'absolute';
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursor.style.background = 'red';
    cursor.style.borderRadius = '50%';
    cursor.style.pointerEvents = 'none'; // Pass clicks through
    cursor.style.zIndex = '99999';
    cursor.style.transform = 'translate(-50%, -50%)'; // Center
    cursor.style.boxShadow = '0 0 10px red';
    cursor.style.left = '50%';
    cursor.style.top = '50%';
    document.body.appendChild(cursor);

    // State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // 3. Initialize PeerJS
    // Generate a short-ish random ID for easier typing if possible, but PeerJS defaults to UUID.
    // We can try to request a custom ID, but collisions are possible.
    // Let's stick to default for now, or maybe generated 4 char?
    // Using default UUID is safer, but harder to type.
    // Let's generate a 4-char random ID and hope for no collisions on the public server (unlikely but possible).
    // Actually, let's just use the default peerjs ID but display it clearly.
    // Better yet, generate a random number.
    const customId = 'os13k-' + Math.floor(Math.random() * 10000);

    const peer = new Peer(customId);

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        statusDiv.innerHTML = `Bridge Ready<br>ID: <span style="font-size: 1.5em; font-weight: bold;">${id}</span>`;
    });

    peer.on('connection', (conn) => {
        statusDiv.innerHTML = 'Controller Connected!';
        statusDiv.style.color = '#0ff';
        statusDiv.style.borderColor = '#0ff';

        conn.on('data', (data) => {
            handleData(data);
        });

        conn.on('close', () => {
            statusDiv.innerHTML = `Bridge Ready<br>ID: <span style="font-size: 1.5em; font-weight: bold;">${peer.id}</span>`;
            statusDiv.style.color = '#0f0';
            statusDiv.style.borderColor = '#0f0';
        });
    });

    peer.on('error', (err) => {
        statusDiv.innerHTML = 'Error: ' + err.type;
        statusDiv.style.color = 'red';
    });

    // 4. Handle Data
    function handleData(data) {
        if (data.type === 'move') {
            mouseX += data.dx * 2; // Sensitivity
            mouseY += data.dy * 2;

            // Clamp
            mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
            mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));

            updateCursor();
            simulateMouseMove();
        } else if (data.type === 'click') {
            simulateClick();
        }
    }

    function updateCursor() {
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    }

    // 5. Simulation Logic
    // We need to interface with OS13kInput.js functions:
    // OS13k_onMouseMove(e), OS13k_onMouseDown(e), OS13k_onMouseUp(e)

    function getTarget() {
        // Hide cursor so elementFromPoint sees what's under it
        cursor.style.display = 'none';
        let target = document.elementFromPoint(mouseX, mouseY);
        cursor.style.display = 'block';
        return target || document.body;
    }

    function simulateMouseMove() {
        const target = getTarget();
        const fakeEvent = {
            x: mouseX,
            y: mouseY,
            clientX: mouseX,
            clientY: mouseY,
            target: target,
            preventDefault: () => {},
            stopPropagation: () => {},
            composedPath: () => [target]
        };

        // Call OS13k handler
        if (typeof OS13k_onMouseMove === 'function') {
            OS13k_onMouseMove(fakeEvent);
        }
    }

    function simulateClick() {
        const target = getTarget();
        const fakeEvent = {
            x: mouseX,
            y: mouseY,
            clientX: mouseX,
            clientY: mouseY,
            target: target,
            button: 0, // Left click
            preventDefault: () => {},
            stopPropagation: () => {},
            composedPath: () => [target]
        };

        if (typeof OS13k_onMouseDown === 'function') {
            OS13k_onMouseDown(fakeEvent);
        }

        setTimeout(() => {
            if (typeof OS13k_onMouseUp === 'function') {
                OS13k_onMouseUp(fakeEvent);
            }
        }, 100);
    }

})();
