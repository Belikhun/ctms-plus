# Contributing Guidelines

## What do I need to know to help?
If you are looking to help to with a code contribution our project uses `javascript` as the main language. We don't use any front-end framework. If you don't feel ready to make a code contribution yet, no problem! You can also check out the [issues tracker](https://github.com/Belikhun/ctms-plus/issues)

For creating a pull request, make sure the target branch is `main`, otherwise, we will simply reject your pull request.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html), So All Code Changes Happen Through Pull Requests
Pull requests are the best way to propose changes to the codebase (we use [Github Flow](https://guides.github.com/introduction/flow/index.html)). We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've changed APIs, update the documentation.
3. Make sure your code lints.

## Any contributions you make will be under the MIT Software License
In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/Belikhun/ctms-plus/issues)
We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/Belikhun/ctms-plus/issues/new?labels=bug%2C+help+wanted&template=bug_report.md); it's that easy!

## Use a Consistent Coding Style

* Use tab size of 4 rather than space
* Brace placement should follow **K&R** style
* Naming should follow [Camel Case](https://en.wikipedia.org/wiki/Camel_case) naming practice
* Add jsDoc on everything you write to better explain what your code do

This code below is an example of how you should write your code:
```js
	let awesomeVariable;
	const NICE_CONST = 727;

	class CowThatMoo {
		// Some code...
	}

	/**
	 * A function that increase number by 1 and return it
	 * 
	 * @param	{Number}	number		Input number
	 * @returns	{Number}	Number increased by 1
	 */
	function someThing(number) {
		return number + 1;
	}

	while (x == y) {
		someThing();
		someThingElse();
	}
```

## Additional

Be sure to add an emoji before every commit message 😎

## License
By contributing, you agree that your contributions will be licensed under its MIT License.