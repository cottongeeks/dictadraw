// npm-check-updates policy for dep-upgrades.sh.
//
// NCU_TARGET=minor keeps each dependency within its major version; latest
// crosses majors. Versions must be 3 days old, so a compromised release is
// likely pulled before it can merge automatically.
module.exports = {
  target: process.env.NCU_TARGET ?? "latest",
  cooldown: 3,
};
