const prvButton = document.querySelector('#prv-button');
const fwdButton = document.querySelector('#fwd-button');

const articles = document.querySelectorAll("article");
const articleMaxIndex = articles.length - 1;

let visibleArticleIndex = 0;


const changeVisibility = (elem, visible) => {
	if (visible == true) {
		elem.classList.remove('hidden');
	} else {
		elem.classList.add('hidden');
	}
};

/*
document.querySelectorAll("article").forEach((el, key) => {
	changeVisibility(el, false);
});
*/

const showArticle = (index) => {
	document.querySelectorAll("article").forEach((el, key) => {
		changeVisibility(el, key == index);
	});
};

fwdButton.addEventListener('click', (evt) => {
	console.log("cur", visibleArticleIndex, "mi", articleMaxIndex)
	if (visibleArticleIndex < articleMaxIndex) {
		visibleArticleIndex += 1;
		changeVisibility(prvButton, true);
	} else if (visibleArticleIndex >= articleMaxIndex) {
		changeVisibility(evt.target, false);
	}
	showArticle(visibleArticleIndex);
});

prvButton.addEventListener('click', (evt) => {
	console.log(articleMaxIndex, visibleArticleIndex);
	if (visibleArticleIndex > 0) {
		visibleArticleIndex -= 1;
		changeVisibility(fwdButton, true);
	} else if (visibleArticleIndex >= 0) {
		changeVisibility(evt.target, false);
	}
	showArticle(visibleArticleIndex);
});

//showArticle(0);
