;(function(window) {
	'use strict'

	const document = window.document

	const label = /#label(?:\/.+){2}/,
		inbox = /#(inbox|imp|al{2})\/.+/,
		fulldesc = /"},"description":{"runs":\[{"text":("(?:[^"\\]|\\.)+")}/,
		shortdesc = /,"shortDescription":("(?:[^"\\]|\\.)+"),/,
		quote = /"/g,
		prevElems = new WeakSet()
	let matched = false
	function hashChange() {
		const hash = document.location.hash
		if (!label.test(hash) && !inbox.test(hash)) return free()

		const elems = document.querySelectorAll('table[class$="video-spotlight-width"]:not([aria-label])')
		for (let i = 0; i < elems.length; ++i) {
			const elem = elems[i]
			if (prevElems.has(elem)) {
				prevElems.delete(elem)
				continue
			}
			prevElems.add(elem)

			fetchAndMatch(
				elem.querySelector('a.nonplayable').href,
				elem.querySelector('tbody > tr:nth-of-type(4) > td > table > tbody > tr > td')
			)
		}
	}

	function fetchAndMatch(url, elem) {
		if (elem === null) return

		fetch(url)
			.then(update.bind(undefined, elem))
			.catch(error)
	}

	function update(elem, html) {
		let match = html.match(shortdesc)
		if (match && match.length > 1) elem.innerText = JSON.parse(match[1]).replace(quote, '') || ''
		else {
			match = html.match(fulldesc)
			elem.innerText = (match && match.length > 1 && JSON.parse(match[1]).replace(quote, '')) || ''
		}

		matched = true
		return html
	}

	function error(e) {
		console.error(e)
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

	function free() {
		if (!matched) return

		matched = false
		;/\s*/g.exec('')
	}

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
