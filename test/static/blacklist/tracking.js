// This file should be blacklisted and therefore this script shouldn't run.
const div = document.createElement('div');
div.id = 'app';
div.innerHTML = '😀';
document.body.append(div);
