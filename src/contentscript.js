;(function(window) {
	'use strict'

	const document = window.document

	const label = /#label(?:\/.+){2}/,
		inbox = /#(inbox|imp|al{2})\/.+/,
		fulldesc = /"},"description":{"runs":\[{"text":("(?:[^"\\]|\\.)+")}/,
		shortdesc = /,"shortDescription":("(?:[^"\\]|\\.)+"),/,
		quote = /"/g,
		prevElems = new WeakSet(), // sometimes Gmail has the old mail still in DOM, so we cache them
		cacheMap = new Map()
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

			fetchFromElem(elem)
		}
	}

	function fetchFromElem(elem) {
		if (elem === null || elem.classList.contains('gmail-yt--matched')) return

		const href = elem.querySelector('a.nonplayable').href,
			el = elem.querySelector('tbody > tr:nth-of-type(4) > td > table > tbody > tr > td')

		if (cacheMap.has(href)) return update(el, cacheMap.get(href))

		fetch(href)
			.then(update.bind(undefined, el))
			.then(cache.bind(undefined, href))
			.catch(error)
	}

	function fetch(url) {
		return window
			.fetch(url, { cache: 'force-cache' })
			.then(checkStatus)
			.then(text)
	}

	function update(elem, html) {
		let match = html.match(shortdesc)
		if (match && match.length > 1) elem.innerText = JSON.parse(match[1]).replace(quote, '') || ''
		else {
			match = html.match(fulldesc)
			elem.innerText = (match && match.length > 1 && JSON.parse(match[1]).replace(quote, '')) || ''
		}
		elem.classList.add('gmail-yt--matched')

		matched = true
		return html
	}

	function cache(href, html) {
		cacheMap.set(href, html)
		return html
	}

	function error(e) {
		console.error(e)
		return e
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

	function free() {
		if (!matched) return

		matched = false
		;/\s*/g.exec('')
		cacheMap.clear()
	}

	let observer
	function observe() {
		observer = new MutationObserver(function(mutations) {
			for (let i = 0; i < mutations.length; ++i) {
				const mutation = mutations[i].target.querySelector('table[class$="video-spotlight-width"]:not([aria-label])')
				if (mutation !== null) window.setTimeout(() => fetchFromElem(mutation), 0)
			}
		})
		observer.observe(document.querySelector('div[id=":5"] + div'), {
			subtree: true,
			childList: true,
		})
	}

	/**
	 * Adds event listeners.
	 *
	 * @author 	Jacob Groß
	 * @date   	2015-06-07
	 */
	function addListener() {
		/** hashchanges */
		window.addEventListener(
			'hashchange',
			function() {
				if (observer === undefined) observe()
				hashChange()
			},
			false
		)
	}

	addListener()
})(window)
