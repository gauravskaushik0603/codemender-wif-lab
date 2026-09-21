const adminService = require('../../services/admin.service');

function safeEvaluate(expr) {
    if (typeof expr === 'number') {
        if (isNaN(expr) || !isFinite(expr)) {
            throw new Error('Invalid number');
        }
        return expr;
    }
    if (typeof expr !== 'string') {
        throw new Error('Invalid formula type');
    }

    const trimmed = expr.trim();
    if (!trimmed || !/^[0-9+\-*/().\s]+$/.test(trimmed)) {
        throw new Error('Invalid characters in formula');
    }

    let pos = 0;

    function skipWhitespace() {
        while (pos < trimmed.length && /\s/.test(trimmed[pos])) {
            pos++;
        }
    }

    function peek() {
        skipWhitespace();
        return pos < trimmed.length ? trimmed[pos] : null;
    }

    function get() {
        skipWhitespace();
        return pos < trimmed.length ? trimmed[pos++] : null;
    }

    function parsePrimary() {
        skipWhitespace();
        const ch = peek();
        if (ch === '(') {
            get();
            const val = parseExpression();
            if (get() !== ')') {
                throw new Error('Mismatched parentheses');
            }
            return val;
        }

        const start = pos;
        let hasDigits = false;
        while (pos < trimmed.length && /[0-9]/.test(trimmed[pos])) {
            hasDigits = true;
            pos++;
        }
        if (pos < trimmed.length && trimmed[pos] === '.') {
            pos++;
            while (pos < trimmed.length && /[0-9]/.test(trimmed[pos])) {
                hasDigits = true;
                pos++;
            }
        }
        if (!hasDigits) {
            throw new Error('Invalid number syntax at position ' + pos);
        }
        return parseFloat(trimmed.slice(start, pos));
    }

    function parseFactor() {
        skipWhitespace();
        if (peek() === '+') {
            get();
            return parseFactor();
        }
        if (peek() === '-') {
            get();
            return -parseFactor();
        }
        return parsePrimary();
    }

    function parseTerm() {
        let val = parseFactor();
        while (true) {
            const op = peek();
            if (op === '*') {
                get();
                val = val * parseFactor();
            } else if (op === '/') {
                get();
                const divisor = parseFactor();
                if (divisor === 0) {
                    throw new Error('Division by zero');
                }
                val = val / divisor;
            } else {
                break;
            }
        }
        return val;
    }

    function parseExpression() {
        let val = parseTerm();
        while (true) {
            const op = peek();
            if (op === '+') {
                get();
                val = val + parseTerm();
            } else if (op === '-') {
                get();
                val = val - parseTerm();
            } else {
                break;
            }
        }
        return val;
    }

    const result = parseExpression();
    skipWhitespace();
    if (pos < trimmed.length) {
        throw new Error('Unexpected token: ' + trimmed[pos]);
    }
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid calculation');
    }
    return result;
}

exports.checkShippingStatus = (req, res) => {
    adminService.pingProvider(req.body.providerIP, req.body.options, out => res.send(out));
};

exports.previewDynamicPricing = (req, res) => {
    try {
        const formula = req.body && req.body.formula;
        const price = safeEvaluate(formula);
        res.json({ price });
    } catch (e) {
        res.status(400).send("Evaluation Failed");
    }
};
