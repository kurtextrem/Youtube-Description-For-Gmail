;(function(window) {
	'use strict'

	const document = window.document

	const label = /#label(?:\/.+){2}/,
		inbox = /#(inbox|imp|al{2})\/.+/,
		fulldesc = /"},"description":{"runs":\[{"text":("(?:[^"\\]|\\.)+")}/,
		shortdesc = /,"shortDescription":("(?:[^"\\]|\\.)+"),/,
		quote = /"/g,
		cacheMap = new Map()
	let regexUsed = false

	const fetchFromElemThrottled = throttle(fetchFromElem, 250)

	function fetchFromElem(elem) {
		if (elem === null || elem.classList.contains('gmail-yt--matched')) return

		const href = elem.querySelector('a.nonplayable').href,
			el = elem.querySelector('tbody > tr:nth-of-type(4) > td > table > tbody > tr > td')

		if (cacheMap.has(href)) return update(el, cacheMap.get(href))

		fetch(href)
			.then(parse)
			.then(update.bind(undefined, el))
			.then(cache.bind(undefined, href))
			.catch(error)
	}

	function fetch(url) {
		return window
			.fetch(url, { cache: 'force-cache' })
			.then(checkStatus)
			.then(toText)
	}

	function parse(html) {
		let match = html.match(shortdesc)
		let ret = ''
		if (match && match.length > 1) {
			ret = JSON.parse(match[1]).replace(quote, '') || ''
		} else {
			match = html.match(fulldesc)
			ret = (match && match.length > 1 && JSON.parse(match[1]).replace(quote, '')) || ''
		}

		regexUsed = true
		return ret
	}

	function update(elem, text) {
		elem.innerText = text
		elem.classList.add('gmail-yt--matched')
		return text
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

	function toText(response) {
		return response.text()
	}

	function free() {
		if (!regexUsed) return

		regexUsed = false
		;/\s*/g.exec('')
	}

	let observer
	function observe() {
		const div = document.querySelector('div[id=":5"] + div')
		if (div === null) return

		observer = new MutationObserver(throttle(handleMutations, 100))
		observer.observe(div, {
			subtree: true,
			childList: true,
		})
	}

	function handleMutations(mutations) {
		const hash = document.location.hash
		if (!label.test(hash) && !inbox.test(hash)) return free()

		console.log('observer')
		for (let i = 0; i < mutations.length; ++i) {
			const mutation = mutations[i].target.querySelector('table[class$="video-spotlight-width"]:not([aria-label])')
			if (mutation !== null) fetchFromElemThrottled(mutation)
		}
	}

	function throttle(callback, wait = 100) {
		let time
		let lastFunc

		return function throttle(...args) {
			if (time === undefined) {
				callback.apply(this, args)
				time = Date.now()
			} else {
				clearTimeout(lastFunc)
				lastFunc = setTimeout(() => {
					if (Date.now() - time >= wait) {
						callback.apply(this, args)
						time = Date.now()
					}
				}, wait - (Date.now() - time))
			}
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
		window.addEventListener('load', function() {
			if (observer !== undefined) observer.disconnect()
			observe()
			window.setInterval(() => cacheMap.clear(), 600000)
		})
	}

	addListener()
})(window)
