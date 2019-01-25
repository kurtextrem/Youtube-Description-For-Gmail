'use strict'

const label = /#label(?:\/.+){2}/,
	inbox = /#(inbox|imp|al{2})\/.+/,
	urlRegex = /&u=\/watch%3F(.*)$/,
	cacheMap = new Map(),
	fetchMap = new Map()

function fetchFromBackground(path) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ path }, html => {
			if (html === undefined && chrome.runtime.lastError)
				return reject(chrome.runtime.lastError.message)

			return resolve(html)
		})
	})
}

function fetchFromElem(elem) {
	if (elem === null) return

	const path = elem.querySelector('a.nonplayable').href.match(urlRegex)[1],
		el = elem.querySelector(
			'tbody > tr:nth-of-type(4) > td > table > tbody > tr > td'
		)

	const maybePromise = fetchMap.get(path)
	if (maybePromise !== undefined) {
		maybePromise.then(update.bind(undefined, el))
		fetchMap.delete(path)
		return
	}

	if (cacheMap.has(path)) update(el, cacheMap.get(path))
	else {
		const promise = fetchFromBackground(path)
			.then(update.bind(undefined, elem))
			.then(cache.bind(undefined, path))
		fetchMap.set(path, promise)
	}
}

function update(elem, text) {
	elem.innerText = text
	//console.log('added text')
	return text
}

function cache(key, html) {
	cacheMap.set(key, html)
	return html
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
	if (!label.test(hash) && !inbox.test(hash)) return

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