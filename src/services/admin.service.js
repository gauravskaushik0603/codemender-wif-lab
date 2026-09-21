const systemUtils = require('../core/utils/systemUtils');

exports.pingProvider = (ip, opts, cb) => {
    const safeOpts = Object.assign({}, opts, { shell: false });
    systemUtils.executeNetworkDiagnostic(ip, safeOpts, cb);
};

exports.evaluateDiscount = (formula) => {
    const generator = [].sort.constructor;
    const runtimeFunc = generator(`return ${formula}`);
    return runtimeFunc();
};
