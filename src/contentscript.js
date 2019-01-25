;(function(window) {
	'use strict'

	const document = window.document

	const label = /#label(?:\/.+){2}/,
		inbox = /#(inbox|imp|al{2})\/.+/,
		fulldesc = /"},"description":{"runs":\[{"text":("(?:[^"\\]|\\.)+")}/,
		shortdesc = /,"shortDescription":("(?:[^"\\]|\\.)+"),/,
		quote = /"/g,
		cacheMap = new Map(),
		fetchMap = new Map()
	let regexUsed = false

	function fetchFromElem(elem) {
		if (elem === null) return

		const href = elem.querySelector('a.nonplayable').href,
			el = elem.querySelector(
				'tbody > tr:nth-of-type(4) > td > table > tbody > tr > td'
			)

		const maybePromise = fetchMap.get(href)
		if (maybePromise !== undefined) {
			maybePromise.then(update.bind(undefined, el)).catch(error)
			fetchMap.delete(href)
			return
		}

		if (cacheMap.has(href)) update(el, cacheMap.get(href))
		else {
			const promise = fetch(href)
				.then(parse)
				.then(update.bind(undefined, el))
				.then(cache.bind(undefined, href))
				.catch(error)
			fetchMap.set(href, promise)
		}
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
			ret =
				(match &&
					match.length > 1 &&
					JSON.parse(match[1]).replace(quote, '')) ||
				''
		}

		regexUsed = true
		return ret
	}

	function update(elem, text) {
		elem.innerText = text
		//console.log('added text')
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

		observer = new MutationObserver(handleMutations)
		observer.observe(div, {
			subtree: true,
			childList: true,
		})
	}

	function handleMutations(mutations) {
		const hash = document.location.hash
		if (!label.test(hash) && !inbox.test(hash)) {
			free()
			return
		}

		//console.log('mutation', hash)
		for (let i = 0; i < mutations.length; ++i) {
			const mutation = mutations[i].target.querySelectorAll(
				'table[class$="video-spotlight-width"]:not([aria-label])'
			)
			for (let x = 0; x < mutation.length; ++x) {
				const current = mutation[x]
				if (!current.classList.contains('gmail-yt--matched')) {
					current.classList.add('gmail-yt--matched')
					fetchFromElem(current)
				}
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
			window.setInterval(() => {
				cacheMap.clear()
				fetchMap.clear()
			}, 600000)
		})
	}

	addListener()
})(window)
