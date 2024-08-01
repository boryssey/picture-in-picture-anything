function insertIntoTarget(element, options) {
  var parent = options.target || document.head;
  parent.appendChild(element);
}

module.exports = insertIntoTarget;
