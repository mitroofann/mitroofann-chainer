/**
 * @file
 * Этот модуль нужен для упрощения синхронной работы и выстроения нужных функций для выполнения в цепочку методов
 * @author mitroofann <mitroofann@gmail.com>
 * @copyright Michael Firsov 2016
 * @version 1.0.0
 * @license
 * MIT License
 *
 * Copyright (c) 2016 mitroofann
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


const defaultMethods = {
	catch: _catch,
	then:  _then,
	wait: _wait
};
const util           = require('util');
//const TIME           = require('mitroofann-datetime');

/**
 * Функция принимает функцию-конструктор и методы которые нужно добавить в прототип
 * Возвращает Конструктор с добавленными методами в прототип, которые можно выстраивать в цепочку
 * @param {constructor} Model Конструктор
 * @param {{string: function}} methods Методы которые нужно добавить в прототип конструктору
 * @returns {function}
 */
function createAPI (Model, methods)
{
	if (typeof Model !== 'function')
	{
		throw new Error(`Model expected to be a constructor.`);
	}

	if (typeof methods !== 'object')
	{
		throw new Error(`An argument must be an object containing function-methods.`);
	}
	else
	{
		for (let method in methods)
		{
			if (methods.hasOwnProperty(method) && typeof methods[method] !== 'function')
			{
				throw new Error(`An argument must be an object containing function-methods.`);
			}
		}
	}

	_addMethods(Model, methods);

	Model = _wrapAPI(Model);

	return Model;
}

/**
 * Служебная функция
 * Оборачивает конструктор и добавляет в него собственные служебные методы
 * @param {constructor} Model Конструктор
 * @returns {function}
 * @private
 */
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

/**
 * Служебный конструктор для обертки функции
 * @constructor
 * @private
 */
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

/**
 * Служебная функция
 * Функция добавляет методы в прототип конструктору
 * @param {constructor} Model функция конструктор, в которую нужно добавить обернутые методы
 * @param {{string: function}} methods Методы, которые нужно добавить в прототип
 * @private
 */
function _addMethods (Model, methods)
{
	methods = Object.assign(methods, defaultMethods);

	for (let name in methods)
	{
		if (methods.hasOwnProperty(name))
		{
			_addMethod(
				Model,
				name,
				methods[name]
			);
		}
	}
}

/**
 * Служебная функция
 * Добавляет метод в прототип конструктору
 * @param {constructor} Model Конструктор, в который нужно добавить метод
 * @param {string} name Наименование метода
 * @param {function} method Функция-метод
 * @private
 */
function _addMethod (Model, name, method)
{
	Model.prototype[name] = _wrap(name, method);
}

/**
 * Служебная функция
 * Оборачивает метод который нужно чейнить
 * @param {string} name Наименование метода
 * @param {function} method Функция-метод
 * @returns {function}
 * @private
 */
function _wrap (name, method)
{
	return _wrapper;

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
}

/**
 * Служебная функция
 * Функция вызывается при вызове обернутого метода из прототипа
 * @param {string} name Наименование метода
 * @param {function} method Функция-метод
 * @param {*[]} params
 * @private
 */
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

/**
 * Служебная функция
 * Функция вызывает метод из цепочки
 * @param method
 * @param params
 * @param args
 * @private
 */
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

/**
 * Служебная функция
 * Функция, которая передается в следующий метод, которую можно вызвать с результатом выполнения для передачи управления следующей функции
 * @param {{called: boolean}} called
 * @param params
 * @returns {*}
 * @private
 */
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

/**
 * Служебная функция
 * Функция, которая передается в следующий метод, которую можно вызвать с ошибокй для передачи управления функции обработки ошибок
 * @param {{called: boolean}} called
 * @param params
 * @returns {*}
 * @private
 */
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

/**
 * Служебная функция
 * При возникновении ошибки в выполнении одной из функций из цепочки ищет близжайшую функцию-ловушку для ошибок и передает управление ей, либо бросает ошибку в лучае отсутствия такого метода
 * @param {Error} err
 * @throws {Error}
 * @private
 */
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

/**
 * Служебная функция
 * Вызывает следующую функцию из цепочки при выполнении предыдущей
 * @param params
 * @private
 */
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

/**
 * Функция добавляется в прототип конструктору
 * Позволяет ловить ошибки возникшие в цепочке и передавать их обработку в пользовательскую функцию
 * @param {function} resolve
 * @param {function} reject
 * @param {function} [callee] Функция, в которую передастся ошибка в случае ее возникновения
 * @param {Error} err
 * @private
 */
function _catch (resolve, reject, callee, err)
{
	if (typeof callee !== 'function')
	{
		throw new Error(`Callee must be a function`);
	}

	callee.call(this, resolve, reject, err);
}

/**
 * Функция добавляется в прототип конструктору
 * Позволяет вызвать в цепочке любую функцию
 * @param {function} resolve
 * @param {function} reject
 * @param {function} [callee] Функция, которую нужно вызвать в очереди цепочки
 * @param rest
 * @private
 */
function _then (resolve, reject, callee, ...rest)
{
	if (typeof callee !== 'function')
	{
		throw new Error(`Callee must be a function`);
	}

	callee.call(this, resolve, reject, ...rest);
}

/**
 * Функция добавляется в прототип конструктору
 * Инициализирует задержку перед выполнением следующей функции из цепочки
 * @param {function} resolve
 * @param {function} reject
 * @param {number} [ms] Количество миллисекунд которое необходимо ждать, по умолчанию - рандомное число от 1000 до 60000
 * @param rest
 * @private
 */
function _wait (resolve, reject, ms, ...rest)
{
	setTimeout(resolve, ms || /*TIME.MS.random(1000, 60000)*/1, ...rest);
}

module.exports = createAPI;