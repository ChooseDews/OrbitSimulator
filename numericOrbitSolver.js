let exports = {};


let timeSpan = 0.0005;
exports.step = function (position, velocity, G, iterations, interval) { //depends only on fuction inputs
    let t = interval || timeSpan;
    if (!G) G = 398600;

    for (let n = 0; n < iterations; n++) {
        let [px, py, pz] = position;
        let [vx, vy, vz] = velocity;
        let radius = Math.sqrt(px * px + py * py + pz * pz);
        let rCubed = radius * radius * radius; //this is a more peformant way todo radius^3
        let [ax, ay, az] = [(-G / rCubed) * px, (-G / rCubed) * py, (-G / rCubed) * pz]; //calculated acceleration based on current position
        [vx, vy, vz] = [vx + ax * t, vy + ay * t, vz + az * t]; //find new velocity using acceleration
        position = [px + vx * t, py + vy * t, pz + vz * t]; //find new position using new velocity
        velocity = [vx, vy, vz];
    }

    return {
        r: position,
        v: velocity
    };
}


module.exports = exports;