const F5 = 0x74;
const F6 = 0x75;

const localPlayer = mp.players.local;
let noclipEnabled = false;
let coordinatesVisible = false;

function toggleNoclip() {
  noclipEnabled = !noclipEnabled;
  localPlayer.freezePosition(noclipEnabled);
  localPlayer.setInvincible(noclipEnabled);
  localPlayer.setAlpha(noclipEnabled ? 170 : 255);
  mp.game.entity.setCollision(localPlayer.handle, !noclipEnabled, true);
}

function toggleCoordinates() {
  coordinatesVisible = !coordinatesVisible;
}

function renderNoclip() {
  if (noclipEnabled) {
    const controls = mp.game.controls;
    const cameraRotation = mp.game.cam.getGameplayCamRot(2);
    const yaw = (cameraRotation.z * Math.PI) / 180;
    const pitch = (cameraRotation.x * Math.PI) / 180;
    const speed = controls.isControlPressed(0, 21) ? 1.2 : 0.35;
    const position = localPlayer.position;
    let x = position.x;
    let y = position.y;
    let z = position.z;
    const forwardX = -Math.sin(yaw) * Math.cos(pitch);
    const forwardY = Math.cos(yaw) * Math.cos(pitch);
    const forwardZ = Math.sin(pitch);

    if (controls.isControlPressed(0, 32)) { x += forwardX * speed; y += forwardY * speed; z += forwardZ * speed; }
    if (controls.isControlPressed(0, 33)) { x -= forwardX * speed; y -= forwardY * speed; z -= forwardZ * speed; }
    if (controls.isControlPressed(0, 34)) { x -= Math.cos(yaw) * speed; y -= Math.sin(yaw) * speed; }
    if (controls.isControlPressed(0, 35)) { x += Math.cos(yaw) * speed; y += Math.sin(yaw) * speed; }
    if (controls.isControlPressed(0, 22)) z += speed;
    if (controls.isControlPressed(0, 36)) z -= speed;

    localPlayer.setCoordsNoOffset(x, y, z, false, false, false);
  }

  if (coordinatesVisible) {
    const { x, y, z } = localPlayer.position;
    const heading = localPlayer.getHeading();
    mp.game.graphics.drawText(
      `X: ${x.toFixed(3)}  Y: ${y.toFixed(3)}  Z: ${z.toFixed(3)}  H: ${heading.toFixed(1)}${noclipEnabled ? "  |  NOCLIP" : ""}`,
      [0.5, 0.5],
      { font: 4, color: [255, 255, 255, 240], scale: [0.35, 0.35], outline: true, centre: true },
    );
  }
}

mp.keys.bind(F5, true, toggleNoclip);
mp.keys.bind(F6, true, toggleCoordinates);
mp.events.add("render", renderNoclip);