let exports = {};


let timeSpan = 0.0009;

exports.step = function (position, velocity, G, iterations, interval) {
    let t = interval || timeSpan;
    if (!G) G = 396600.4;

    for (let n = 0; n < iterations; n++) {
        let [px, py, pz] = position;
        let [vx, vy, vz] = velocity;
        let radius = Math.sqrt(px * px + py * py + pz * pz);
        let rCubed = Math.pow(radius, 3);
        let [ax, ay, az] = [(-G / rCubed) * px, (-G / rCubed) * py, (-G / rCubed) * pz];
        let [vnx, vny, vnz] = [vx + ax * t, vy + ay * t, vz + az * t];
        position = [px + vnx * t, py + vny * t, pz + vnz * t];
        velocity = [vnx, vny, vnz];
    }

    return {
        r: position,
        v: velocity
    };
}


module.exports = exports;
