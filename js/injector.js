var issues = [];
var sortedIssues = [];
var columnHeaders = [];
var documentTitle = document.title;
documentTitle = documentTitle.replace('- Agile Board -', '-');
documentUrl = document.URL;
daysRem = document.URL;
var documentToken = document.getElementById('atlassian-token').getAttribute('content');

function isolateAssigneeNameAndAvatarURL(taskDiv) {
    var imgsArray = taskDiv.getElementsByClassName('ghx-avatar-img');
    for (var i = 0; i < imgsArray.length; i++) {
        var name = imgsArray[i].dataset.tooltip.slice(10);
        if (imgsArray[i].dataset.tooltip.length > 0) {
            return {
                name: name,
                avatar: imgsArray[i].src ? imgsArray[i].src : null
            };
        }
    }
    return {
        name: 'Unassigned'
    };
}

function sortIssues() {
    var assignee = [];
    var doneNumber = 0;
    for (var i = 0; i < issues.length; i++) {
        var stepIssue = issues[i];
        if (assignee.indexOf(stepIssue.name) == -1) {
            assignee.push(stepIssue.name);
            if (stepIssue.done == true) {
                doneNumber = doneNumber + 1;
            }
            sortedIssues.push({
                assignee: stepIssue.name,
                done: stepIssue.done == true ? 1 : 0,
                todo: stepIssue.done == false ? 1 : 0,
                avatar: stepIssue.avatar,
                tasks: [{
                    issueTitle: stepIssue.issueTitle,
                    issueKey: stepIssue.issueKey,
                    issueHref: stepIssue.href,
                    done: stepIssue.done,
                    column: stepIssue.column
                }]
            });
        } else {
            for (var z = 0; z < sortedIssues.length; z++) {
                var elem = sortedIssues[z];
                if (elem.assignee == stepIssue.name) {
                    if (stepIssue.done == true) {

                        elem.done = elem.done + 1;
                        doneNumber = doneNumber + 1;
                    }
                    elem.todo = stepIssue.done == false ? (elem.todo + 1) : elem.todo;
                    elem.tasks.push({
                        issueTitle: stepIssue.issueTitle,
                        issueKey: stepIssue.issueKey,
                        issueHref: stepIssue.href,
                        done: stepIssue.done,
                        column: stepIssue.column
                    });
                }
            }
        }
    }
    var d = new Date();
    var n = d.toUTCString();
    chrome.runtime.sendMessage({
        sortedIssues: sortedIssues,
        documentTitle: documentTitle,
        documentToken: documentToken,
        documentUrl: documentUrl,
        columnHeaders: columnHeaders,
        doneNumber: doneNumber,
        issuesLength: issues.length,
        updated: n
    });
}

function extractColumnName(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var element = nodes[i];
        var tag = element.querySelector('H2');
        if (tag) {
            return tag.innerText;
        }
    }
}

function getColumnsHeaders() {
    var container = document.getElementsByClassName("ghx-column-headers");
    var divs = container[0];
    for (var i = 0; i < divs.children.length; i++) {
        var columnId = divs.children[i].dataset.id;
        var innerText = extractColumnName(divs.children[i].childNodes);
        innerText = innerText.toLowerCase();
        innerText = innerText == "negative review" ? "fix it!" : innerText;
        innerText = innerText.indexOf('in ') != -1 ? innerText.slice(3) : innerText;
        columnHeaders.push({
            columnId: columnId,
            innerText: innerText,
            position: i
        });
    }
}

function searchForNodeWithColumnAtrr(node) {
    var found = node.getAttribute("data-column-id");
    do {
        found = node.getAttribute("data-column-id");
        node = node.parentElement;
    }
    while (found == null);
    return found;
}

function getTaskColumnName(task) {
    var taskColumnId = searchForNodeWithColumnAtrr(task.parentElement);
    for (var i = 0; i < columnHeaders.length; i++) {
        var element = columnHeaders[i];
        if (element.columnId == taskColumnId) {
            return element.innerText;
        }
    }
}

function findTaskHref(div) {
    var anchor = div.getElementsByTagName('a');
    return anchor[0].href;
}

function activate() {
    getColumnsHeaders();
    var divs = document.getElementsByClassName("ghx-issue");
    for (var i = 0; i < divs.length; i++) {
        var task = isolateAssigneeNameAndAvatarURL(divs[i]);
        task.href = findTaskHref(divs[i]);
        task.column = getTaskColumnName(divs[i]);
        task.done = divs[i].classList.value.indexOf('ghx-done') != -1 ? true : false;
        task.issueKey = (divs[i].dataset.issueKey);
        task.issueTitle = (divs[i].firstChild.innerText);
        issues.push(task);
    }
    sortIssues();
}

activate();