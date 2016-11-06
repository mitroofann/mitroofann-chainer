
const API = require('./index');

function _Constructor (a, b, c, ...params)
{
	console.log('Building constructor with params:', arguments);

	this.a = a;
	this.b = b;
	this.c = c;
	this.params = params;
}

_Constructor.prototype.functionOfPrototype = function functionOfPrototype (...rest)
{
	console.log('functionOfPrototype method called with arguments: ', rest);
};

function first (resolve, reject, ...rest)
{
	console.log('First method called with arguments: ', rest);

	resolve('to second');
}

function second (resolve, reject, ...rest)
{
	console.log('Second method called with arguments: ', rest);

	resolve('to third');
}

function third (resolve, reject, ...rest)
{
	console.log('Third method called with arguments: ', rest);

	resolve('to functionReject function');
}

function functionReject (resolve, reject, ...rest)
{
	console.log('functionReject method called with arguments: ', rest);

	throw new Error(`Thrown`);
}

function catchThrown (resolve, reject, err)
{
	console.log('catchThrown method called with arguments: ', err);

	//here you can continue or reject again

	resolve();
}

function onThen (resolve, reject, ...rest)
{
	console.log('onThen method called with arguments: ', rest);

	reject();
}

function catchThrownAgain (resolve, reject, err)
{
	console.log('catchThrownAgain method called with arguments: ', err);

	this.functionOfPrototype();//you can use any of your methods

	this//you can chain it here
		.first('First again!')
		.second('Second again!')
		.functionReject()//then call the "functionReject" method
		.first()//won't be called, because of error thrown
		.second()//won't be called, because of error thrown
		.catch(catchThrown)//catch the error thrown in "functionReject" method
		//if you won't catch rejecting here it'll move above

	resolve();//functions chained in current function will start after calling "resolve"
	//if an error occurs or a reject method calls then all chained functions here will be ignored
}

const Constructor = new API(
	_Constructor,
	{
		first,
		second,
		third,
		functionReject,
		onThen
	}
);

const constructor = new Constructor(
	'"A" argument',
	'"B" argument',
	'"C" argument',
	'rest 1',
	'rest 2'
);

console.log(`It's an instanse of your origin constructor: `, constructor instanceof _Constructor);

constructor
	.first('to first from start')//call the "first" method
	.second('to second from start')//then call the "second" method
	.third('to third from start')//then call the "third" method
	.functionReject('From start to functionReject')//then call the "functionReject" method
	.first()//won't be called, because of error thrown
	.second()//won't be called, because of error thrown
	.catch(catchThrown)//catch the error thrown in "functionReject" method
	.wait(5000)//wait 5 seconds till calling a next method
	.then(onThen)//Any other method
	.first()//won't be called, because of error thrown
	.second()//won't be called, because of error thrown
	.catch(catchThrownAgain)//catch the error thrown in "onThen" method

