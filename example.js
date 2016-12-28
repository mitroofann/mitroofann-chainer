
function Constructor (parameter1 = 'someValueByDefault', parameter2, ...restParameters)
{
	this.parameter1 = parameter1;
	this.parameter2 = parameter2;

	for (let i = 3; i < restParameters.length + 3; i++)
	{
		this[`parameter${i}`] = restParameters[i - 3];
	}
}

Constructor.prototype.constructorDefaultMethod = value => value.toUpperCase();

const methodsForChain = {
	log: function (resolve, reject, usersParameter, ...restUsersParameters)
	{
		console.log(usersParameter, ...restUsersParameters);

		resolve();
	},
	asyncMethodExample: function (resolve, reject, asyncTimeout)
	{
		console.log(`Let's do something async!`);

		setTimeout(resolve, asyncTimeout, `Async methods work!`);
	},
	thisWillNotBeCalled: function (resolve, reject, ...rest)
	{
		console.log(`This text won't ever be shown`);
	},
	thisWillNotBeCalledToo: function (resolve, reject, ...rest)
	{
		console.log(`This text won't ever be shown too`);
	},
	whyDoNotWeThrows: function (resolve, reject, ...rest)
	{
		console.log(`Let's throw an error`);

		undefined.reallyBad;//be careful! it's just an example!
	},
	throwAgain: function (resolve, reject, throwParameter, ...rest)
	{
		if (throwParameter)
		{
			throw new Error(`I don't like when you call me with throwParameter!`)
		}
		else
		{
			reject(new Error(`the same thing as synchronous throwing`));
		}
	},
	isTHISInstanceOfConstructor: function (resolve, reject, ...rest)
	{
		console.log(this instanceof Constructor);

		resolve();
	},
	setValueToTHIS: function (resolve, reject, name, value, ...rest)
	{
		this[name] = value;

		resolve();
	},
	getValueFromTHIS: function (resolve, reject, name, ...rest)
	{
		resolve(this[name]);
	},
	asyncRejectExample: function (resolve, reject, howLongToWait, ...rest)
	{
		setTimeout(reject, howLongToWait, new Error('Async Reject'));
	},
	synchronouslyWorks: function (resolve, reject, msg, ...rest)
	{
		this
			.log(`manually called "synchronouslyWorks" with message: ${msg}`);

		resolve();
	},
	asynchronouslyWorks: function (resolve, reject, msg, ...rest)
	{
		this
			.log(`manually called "asynchronouslyWorks" with message: ${msg}`)
			.then((resolve, reject, ...rest) => {
				setTimeout(resolve, 1000, 'Oh God, even here....')
			});

		resolve();
	},
	manuallySwitch: function (resolve, reject, functionNumber, ...rest)
	{
		if (this.functionNumber === 1 || functionNumber === 1)
		{
			this
				.synchronouslyWorks('hey 1!');
		}
		else if (this.functionNumber === 2 || functionNumber === 2)
		{
			this
				.asynchronouslyWorks('hey 2!');
		}
		else
		{
			this
				.log('Wrong number!')
		}

		resolve();
	}
};

const CHAIN = require('./index.js');

const ChainedConstructor = CHAIN(Constructor, methodsForChain);

const myObject = new ChainedConstructor('parameter 1', 'parameter 2', 'parameter 3', 'parameter 4');//parameter 1 parameter 2 parameter 3 parameter 4

console.log(myObject.parameter1, myObject.parameter2, myObject.parameter3, myObject.parameter4);

console.log(myObject instanceof Constructor); //true

console.log(myObject.constructorDefaultMethod('got something to say?')); //GOT SOMETHING TO SAY?

myObject
	.log('say hi')// say hi
	.wait(1000)//Стандартный метод, пауза перед выполнением следующего метода. По умолчанию от 1 до 60 секунд рандомно
	.log('and', 'then', 'say', 'bye')//and then say bye
	.then((resolve, reject, ...rest) => {
		console.log('and here we go again');//and here we go again

		resolve('and even again', 'many', 'many', 'times');
	})//Стандартный метод, позволяющий передать управление любой функции
	.then((resolve, reject, ...rest) => {
		console.log(...rest);//and even again many many times

		reject(new Error('maybe enough?'));
	})
	.catch((resolve, reject, err) => {
		console.log(err);//Error: maybe enough?

		resolve('Successful error processing!');
	})
	.log('We did it!')//We did it! Successful error processing!
	.asyncMethodExample(1000)//Let's do something async!
	.log()//Async methods work!
	.whyDoNotWeThrows()//Let's throw an error
	.thisWillNotBeCalled()
	.thisWillNotBeCalledToo()
	.thisWillNotBeCalled()
	.thisWillNotBeCalledToo()
	.catch((resolve, reject, err) => {
		console.log(err);//TypeError: Cannot read property 'reallyBad' of undefined

		resolve('Successful error processing!');
	})//when we catch errors thrown or errors functions rejected with we follow to the nearest "catch" method
	.throwAgain(true)
	.catch((resolve, reject, err) => {
		console.log(err);//Error: I don't like when you call me with throwParameter!

		resolve();
	})
	.throwAgain(false)
	.catch((resolve, reject, err) => {
		console.log(err);//Error: the same thing as synchronous throwing

		resolve();
	})
	.isTHISInstanceOfConstructor()//true
	.setValueToTHIS('myOwnValue', 'mitroofann')
	.getValueFromTHIS('myOwnValue')
	.log()//mitroofann
	.then((resolve, reject, ...rest) => {
		console.log(myObject.myOwnValue);//mitroofann

		resolve();
	})
	.log(`Let's try add methods to chain right now!`)//Let's try add methods to chain wright now!
	.then(function (resolve, reject, ...rest) {
		this
			.log('Oh GOD, we can do it!')//Oh GOD, we can do it!
			.whyDoNotWeThrows()//Let's throw an error
			.thisWillNotBeCalled()
			.thisWillNotBeCalledToo()
			.catch((resolve, reject, err) => {
				console.log(err);//TypeError: Cannot read property 'reallyBad' of undefined

				resolve('called from here: my label 1');
			})
			.log();//called from here: my label 1

		resolve();
	})
	.catch((resolve, reject, err) => {

		resolve('called from here: my label 2');

	})//won't be called
	.then(function (resolve, reject, ...rest) {

		this
			.log(`But if we don't catch...`)//But if we don't catch...
			.whyDoNotWeThrows()//Let's throw an error
			.thisWillNotBeCalled()
			.thisWillNotBeCalledToo();

		resolve();
	})
	.catch((resolve, reject, err) => {

		resolve('called from here: my label 2');

	})//won't be called
	.log()//called from here: my label 2
	.asyncRejectExample(1000)
	.log(`Won't be shown`)
	.catch(function (resolve, reject, err) {
		console.log(err);//Error: Async Reject

		console.log(this.constructorDefaultMethod('hey, it must work too'));//HEY, IT MUST WORK TOO

		resolve();
	})
	.setValueToTHIS('functionNumber', 2)
	.manuallySwitch()//manually called "asynchronouslyWorks" with message: hey 2!
	.log(`It's from above function:`)//It's from above function:  Oh God, even here....
	.setValueToTHIS('functionNumber', 1)
	.manuallySwitch()//manually called "synchronouslyWorks" with message: hey 1!
	.setValueToTHIS('functionNumber', 0)
	.manuallySwitch()//Wrong number!
	.manuallySwitch(5)//Wrong number!
	.manuallySwitch(1)//manually called "synchronouslyWorks" with message: hey 1!
	.log('I think you got what this module does')
	.log('Remember to use catch method, at least 1 catch in the bottom of chain to prevent this shit:')//Remember to use catch method, at least 1 catch in the bottom of chain to prevent this shit:
	.then((resolve, reject) => reject())
	.log(`won't be called cause the error thrown`);