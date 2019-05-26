'use strict'

const options = {
	cache: 'force-cache',
	headers: new Headers({
		Connection: 'keep-alive',
	}),
}

function fetchCache(url) {
	return fetch(url, options)
		.then(checkStatus)
		.then(toText)
}

const fulldesc = /"},"description":{"runs":\[{"text":("(?:[^"\\]|\\.)+")}/,
	shortdesc = /,"shortDescription":("(?:[^"\\]|\\.)+"),/,
	quote = /"/g

let regexUsed = false

function parse(html) {
	let match = html.match(shortdesc)
	let returnValue = ''
	if (match && match.length > 1) {
		returnValue = JSON.parse(match[1]).replace(quote, '') || ''
	} else {
		match = html.match(fulldesc)
		returnValue =
			(match && match.length > 1 && JSON.parse(match[1]).replace(quote, '')) ||
			''
	}

	regexUsed = true
	return returnValue
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

function error(e) {
	console.error(e)
	return e
}

function free() {
	if (!regexUsed) return

	regexUsed = false
	;/\s*/g.exec('')
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	fetchCache(
		'https://www.youtube.com/watch?' + decodeURIComponent(request.path)
	)
		.then(parse)
		.then(sendResponse)
		.catch(error)

	return true
})

setInterval(() => {
	free()
}, 600000)

const preconnect = document.createElement('link')
preconnect.rel = 'preconnect'
preconnect.href = 'https://www.youtube.com/'
document.head.appendChild(preconnect)
