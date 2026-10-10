import test from "node:test";
import assert from "node:assert/strict";
import quest from "../electron/quest-connection.cjs";

test("Quest connection recognizes an authorized ADB device", () => {
  assert.deepEqual(quest.parseAdbDevices("List of devices attached\r\nSERIAL123\tdevice\r\n"), {
    code: "ready",
    serial: "SERIAL123",
  });
});

test("Quest connection distinguishes absent, unauthorized and offline ADB devices", () => {
  assert.equal(quest.parseAdbDevices("List of devices attached\n").code, "none");
  assert.equal(quest.parseAdbDevices("List of devices attached\nSERIAL123\tunauthorized\n").code, "unauthorized");
  assert.equal(quest.parseAdbDevices("List of devices attached\nSERIAL123\toffline\n").code, "offline");
});

test("Quest connection refuses multiple authorized ADB devices", () => {
  assert.equal(quest.parseAdbDevices("List of devices attached\nONE\tdevice\nTWO\tdevice\n").code, "multiple");
});
