;(function(window) {
	'use strict'

	const document = window.document

	const label = /#label\/.+\/.+/,
		inbox = /#(inbox|imp|all)\/.+/,
		fulldesc = /"},"description":{"runs":\[{"text":("((?!"}).)+")}/,
		shortdesc = /,"shortDescription":("[^"]+")/,
		quote = /"/g,
		prevElems = new WeakSet()
	function hashChange() {
		const hash = document.location.hash
		if (!label.test(hash) && !inbox.test(hash)) return

		const elems = document.querySelectorAll('table[class$="video-spotlight-width"]:not([aria-label])')
		for (let i = 0; i < elems.length; ++i) {
			let elem = elems[i]
			if (prevElems.has(elem)) {
				prevElems.delete(elem)
				continue
			}
			prevElems.add(elem)

			const url = elem.querySelector('a.nonplayable').href

			elem = elem.querySelector('tbody > tr:nth-of-type(4) > td > table > tbody > tr > td')
			console.log(elem, url)
			if (elem) {
				fetch(url)
					.then(function update(text) {
						let match = text.match(shortdesc)
						if (match && match.length > 1) elem.innerText = JSON.parse(match[1]).replace(quote, '') || ''
						else {
							match = text.match(fulldesc)
							elem.innerText = (match && match.length > 1 && JSON.parse(match[1]).replace(quote, '')) || ''
						}

						elem = null
						return text
					})
					.catch(function error(e) {
						elem = null
					})
			}
		}
	}

	function checkStatus(response) {
		if (response.ok) return response

		const error = new Error(`HTTP Error ${response.statusText}`)
		error.status = response.statusText
		error.response = response
		console.error(error)
		throw error
	}

	function text(response) {
		return response.text()
	}

	function fetch(url) {
		return window
			.fetch(url)
			.then(checkStatus)
			.then(text)
	}

	/**
	 * Adds event listeners.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	function addListener() {
		/** hashchanges */
		window.addEventListener('hashchange', hashChange, false)
	}

	addListener()
})(window)
