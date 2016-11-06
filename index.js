
const defaultMethods = {
	catch: _catch,
	then:  _then,
	wait: _wait
};
const util           = require('util');
const TIME           = require('time');

function createAPI (Model, methods)
{
	if (typeof Model !== 'function')
	{
		throw new Error(`Model expected to be a constructor.`);
	}

	if (!methods || typeof methods !== 'object')
	{
		throw new Error(`An argument must be an object containing function-methods.`);
	}

	_addMethods(Model, methods);

	Model = _wrapAPI(Model);

	return Model;
}

function _wrapAPI (Model)
{
	function ModelWrapped (...rest)
	{
		const model = new Model(...rest);

		API.call(model);

		return model;
	}

	util.inherits(ModelWrapped, Model);

	return ModelWrapped;
}

function API()
{
	Object.defineProperty(
		this,
		'____callbacks',
		{
			writable:     false,
			configurable: true,
			enumerable:   false,
			value:        []
		}
	);
	Object.defineProperty(
		this,
		'____currentCallback',
		{
			writable:     true,
			configurable: true,
			enumerable:   false,
			value:        0
		}
	);
	Object.defineProperty(
		this,
		'____notRunning',
		{
			writable:     true,
			configurable: true,
			enumerable:   false,
			value:        true
		}
	);
}

function _addMethods (Model, methods)
{
	methods = Object.assign(methods, defaultMethods);

	for (let name in methods)
	{
		if (methods.hasOwnProperty(name))
		{
			if (typeof methods[name] === 'function')
			{
				_addMethod(
					Model,
					name,
					methods[name]
				);
			}
			else
			{
				throw new Error(`Each Method must be a function. Method ${name} is not a function.`);
			}
		}
	}
}

function _addMethod (Model, name, method)
{
	Model.prototype[name] = _wrap(name, method);
}

function _wrap (name, method)
{
	function _wrapper (...params)
	{
		_chain.call(
			this,
			name,
			method,
			params
		);

		return this;
	}

	return _wrapper;
}

function _chain (name, method, params)
{
	const next = _callee.bind(
		this,
		method,
		params
	);

	next._name = name;

	this.____callbacks.splice(
		this.____currentCallback++,
		0,
		next
	);

	if (this.____notRunning)
	{
		this.____notRunning = false;

		process.nextTick(_next.bind(this));
	}
}

function _callee (method, params, ...args)
{
	const called = {
		value: false
	};

	method.call(
		this,
		_resolve.bind(this, called),
		_reject.bind(this, called),
		...params.concat(args)
	);
}

function _resolve (called, ...params)
{
	if (false === called.value)
	{
		called.value = true;

		process.nextTick(
			_next.bind(this),
			...params
		);
	}
}

function _reject (called, ...params)
{
	let err = params[0] || new Error('Rejected without an error');

	if (true === called.value)
	{
		if (params.length === 3 && typeof params[1] === 'function')
		{
			return process.nextTick(
				params[1],
				params[2]
			);
		}
		else
		{
			return;
		}
	}

	called.value = true;

	process.nextTick(
		_rejectHelper.bind(this),
		err
	);
}

function _rejectHelper (err)
{
	if (this.____currentCallback !== 0 && this.____callbacks.length > this.____currentCallback)
	{
		this.____callbacks.splice(0, this.____currentCallback);
	}

	while (this.____callbacks.length > 0)
	{
		const reject = this.____callbacks.shift();

		if (reject._name === 'catch')
		{
			return process.nextTick(
				reject,
				err
			);
		}
	}

	throw new Error(`Use "catch" method to catch errors thrown`);
}

function _next (...params)
{
	this.____currentCallback = 0;

	if (this.____callbacks.length > 0)
	{
		try
		{
			let callback;

			do
			{
				callback = this.____callbacks.shift();
			}
			while (callback._name === 'catch');

			if (typeof callback === 'function')
			{
				callback(...params);
			}
			else
			{
				this.____notRunning = true;
			}
		}
		catch (err)
		{
			_reject.call(
				this,
				{
					value: false
				},
				err
			);
		}
	}
	else
	{
		this.____notRunning = true;
	}
}

function _catch (resolve, reject, callee, err)
{
	if (typeof callee !== 'function')
	{
		throw new Error(`Callee must be a function`);
	}

	callee.call(this, resolve, reject, err);
}

function _then (resolve, reject, callee, ...rest)
{
	if (typeof callee !== 'function')
	{
		throw new Error(`Callee must be a function`);
	}

	callee.call(this, resolve, reject, ...rest);
}

function _wait (resolve, reject, ms, ...rest)
{
	setTimeout(resolve, ms || TIME.MS.random(1000, 60000), ...rest);
}

module.exports = createAPI;