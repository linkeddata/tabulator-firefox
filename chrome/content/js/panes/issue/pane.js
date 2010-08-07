/*   Issue Tracker Pane
**
**  This outline pane allows a user to interact with an issue,
to change its state according to an ontology, comment on it, etc.
*/

    
// These used to be in js/init/icons.js but are better in the pane.
tabulator.Icon.src.icon_bug = iconPrefix + 'js/panes/issue/tbl-bug-22.png';
tabulator.Icon.tooltips[tabulator.Icon.src.icon_bug] = 'Track issue'

tabulator.panes.register( {

    icon: tabulator.Icon.src.icon_bug,
    
    name: 'issue',
    
    // Does the subject deserve an issue pane?
    label: function(subject) {
        var kb = tabulator.kb;
        var t = kb.findTypeURIs(subject);
        if (t["http://www.w3.org/2005/01/wf/flow#Task"]) return "issue";
        if (t["http://www.w3.org/2005/01/wf/flow#Tracker"]) return "tracker";
        // Later: Person. For a list of things assigned to them,
        // open bugs on projects they are developer on, etc
        return null; // No under other circumstances (while testing at least!)
    },

    render: function(subject, myDocument) {
        var kb = tabulator.kb;
        var ns = tabulator.ns;
        var WF = $rdf.Namespace("http://www.w3.org/2005/01/wf/flow#");
        var DC = $rdf.Namespace("http://purl.org/dc/elements/1.1/");
    
        var div = myDocument.createElement("div")
        div.setAttribute('class', 'issuePane');
        div.innherHTML='<h1>Issue</h1><p>This is a pane under development</p>';

        var commentFlter = function(pred, inverse) {
            if (!inverse && pred.uri == 
                "http://www.w3.org/2000/01/rdf-schema#comment") return true;
            return false
        }
        
        var complain = function complain(message){
            var p = myDocument.createElement("p");
            p.setAttribute('style', 'color: red');
            div.appendChild(p);
            p.appendChild(myDocument.createTextNode('Error: '+message));
        } 

        // Make SELECT tag
        var makeSelectForCategory = function(subject, category, storeDoc) {
            var sparqlService = new tabulator.rdf.sparqlUpdate(kb);
            var types = kb.findTypeURIs(subject);
            var du = kb.any(category, OWL('disjointUnionOf'));
            var subs;
            var multiple = false;
            if (!du) {
                // throw 'select class has no disjoint union.'+category;
                subs = kb.each(undefined, ns.rdfs('subClassOf'), category);
                multiple = true;
            } else {
                subs = du.elements            
            }
            var n = 0; var uris ={}; // Count them
            for (var i=0; i < subs.length; i++) {
                var sub = subs[i];
                if (sub.uri in uris) continue;
                uris[sub.uri] = true; n++;
            } // uris is now the set of possible options
            
            var onChange = function(e) {
                // select.setAttribute('class', 'pending');
                select.disabled = true; // until data written back
                if (true) {
                    // throw "Multiple selections not implemented @@";
                    var ds = [];
                    var is = [];
                    for (var i =0; i< select.options.length; i++) {
                        var opt = select.options[i];
                        if (!opt.AJAR_uri) continue; // a prompt
                        // dump('   option AJAR_uri='+opt.AJAR_uri+', selected='+opt.selected+'\n')
                        if (opt.selected && !(opt.AJAR_uri in types)) {
                            is.push(new $rdf.Statement(subject,
                                ns.rdf('type'), kb.sym(opt.AJAR_uri),storeDoc ));
                        }
                        if (!opt.selected && opt.AJAR_uri in types) {
                            ds.push(new $rdf.Statement(subject,
                                ns.rdf('type'), kb.sym(opt.AJAR_uri),storeDoc ));
                        }                        
                    }
                    sparqlService.update(ds, is,
                        function(uri, success, body) {
                            types = kb.findTypeURIs(subject); // Review our list of types
                            if (success) select.disabled = false; // data written back
                            else dump("makeSelectForCategory: Error writing back:"+body+"\n");    
                        });
                }
            }
            if (n>0) {
                var select = myDocument.createElement('select');
                if (multiple) select.setAttribute('multiple', 'true');
                for (var uri in uris) {
                    var c = kb.sym(uri)
                    var option = myDocument.createElement('option');
                    option.appendChild(myDocument.createTextNode(tabulator.Util.label(c)));
                    var style = kb.any(c, kb.sym("http://www.w3.org/ns/ui#style"))
                    if (style) option.firstChild.setAttribute('style', style.value)
                    option.AJAR_uri = uri;
                    if (uri in types) {
                        option.setAttribute('selected', 'true')
                        select.oldURI = uri;
                    }
                    select.appendChild(option);
                }
                if (select.oldURI && !multiple) {
                    var prompt = myDocument.createElement('option');
                    prompt.appendChild(myDocument.createTextNode("--classify--"));
                    select.insertBefore(prompt, select.firstChild)
                }
                select.addEventListener('change', onChange, false)
                return select;
            }
            return null;
        
        } // makeSelectForCategory
        
        
        
        // Make a box to demand a description or display existing one
        var makeDescription = function(myDocument, subject, storeDoc) {
            var group = myDocument.createElement('div');
            var sts = kb.statementsMatching(subject, WF('description')); // Only one please
            var desc = sts? sts[0].object.value : "";
            var field = myDocument.createElement('textarea');
            group.appendChild(field);
            field.rows = 10;
            field.cols = 80;
            field.setAttribute('style', "border: 0.1em; padding: 2em; left-margin: 3em;")
            if (desc) field.value = desc;
            else field.select(); // Select it ready for user input
            var submit = null; // No submit button yet
            var groupSubmit = function(e) {
                submit.disabled = true;
                field.disabled = true;
                if (desc) { // Update
                    
                } else { // Add new
                
                }
            }
            var fieldChange = function fieldChange(e) {
                if (!submit) {
                    var br = myDocument.createElement('br');
                    group.appendChild(br);
                    submit = myDocument.createElement('input');
                    submit.setAttribute('type', 'submit');
                    group.appendChild(submit);
                    submit.addEventListener('click', groupSubmit, false)
                }
            }
            select.addEventListener('change', fieldChange, false);
        }
        
        
        
        
        
        
        // Too low level but takes multiple statements - should upgrade updateService
        var sparqlService = new tabulator.rdf.sparqlUpdate(kb);

        // Claim the next sequential number -- unused?
        var usingNextID = function usingNextID(thing, kb, callback) {
            var docuri = tabulator.rdf.Util.uri.docpart(thing.uri);
            if (doc == object.uri) throw 'usingNextID - must have a hash in uri:'+thing.uri;
            var sts = kb.statementsMatching(thing, tabulator.ns.link('nextID'));
            if (sts.length == 0) {
                sparqlService.insertStatement(new $rdf.Statement(
                        thing, tabulator.ns.link('nextID'), 1,kb.sym(doc)),
                        function(uri, success, body){
                            if (!success) throw "Error setting first ID for "+thing;
                })
            } else {
                var id = 0 + sts[0].object.value;
                var updater = sparqlService.update_statement(sts[0]);
                updater.set_object(id+1, function(uri, success, body){
                    if (success) {
                        callback(id);
                    } else {
                        dump("Failed to get new ID, asssume clash, retrying:"+body+"\n");
                        usingNextID(thing, kb, callback);
                    }
                });
            }
        }
        

        var plist = kb.statementsMatching(subject)

        var t = kb.findTypeURIs(subject);

        //              Render a single issue
        
        if (t["http://www.w3.org/2005/01/wf/flow#Task"]) {
            tabulator.outline.appendPropertyTRs(div, plist, false,
                function(pred, inverse) {
                    if (!inverse && pred.uri == 
                        "http://www.w3.org/2000/01/rdf-schema#comment") return true;
                    return false
                });

            var types = kb.findTypeURIs(subject);


            
            var tracker = kb.any(subject, WF('tracker'));
            if (!tracker) throw 'This issue '+subject+'has no tracker';
            var states = kb.any(tracker, WF('issueClass'));
            if (!states) throw 'This tracker '+tracker+' has no issueClass';
            var stateStore = kb.any(tracker, WF('stateStore'));
            if (!stateStore) throw 'This tracker '+tracker+' has no stateStore';

            var cats = kb.each(tracker, WF('issueCategory')); // zero or more
            var select = makeSelectForCategory(subject, states, stateStore)
            div.appendChild(select);
            for (var i=0; i<cats.length; i++) {
                div.appendChild(makeSelectForCategory(subject, cats[i], stateStore));
            }






        // Render a Tracker instance
        } else if (t["http://www.w3.org/2005/01/wf/flow#Tracker"]) {
            var p = myDocument.createElement("p");
            div.appendChild(p);
            p.innerHTML = "This is a Tracker @@";
            
            var states = kb.any(subject, WF('issueClass'));
            if (!states) throw 'This tracker has no issueClass';
            var stateStore = kb.any(subject, WF('stateStore'));
            if (!stateStore) throw 'This tracker has no stateStore';
            tabulator.sf.requestURI(stateStore.uri, subject, false); // Pull in issues
            var cats = kb.each(subject, WF('issueCategory')); // zero or more
            

            var newIssueForm = function(e) {
                var form = myDocument.createElement('form');
                var sendNewIssue = function() {
                    titlefield.setAttribute('class',"pendingedit");
                    titlefield.disabled = true;
                    sts = [];
                    
                    var now = new Date();
                    var timestamp = ''+ now.getTime();
                    // http://www.w3schools.com/jsref/jsref_obj_date.asp
                    var issue = kb.sym(stateStore.uri + '#' + 'Iss'+timestamp);

                    var link = new $rdf.Statement(issue, WF('tracker'), subject, stateStore)
                    sts.push(link);

                    var title = kb.literal(titlefield.value);
                    sts.push(new $rdf.Statement(issue, DC('title'), title, stateStore))

                    sts.push(new $rdf.Statement(issue, ns.rdfs('comment'), "", stateStore))

                    var initialState = kb.any(subject, WF('initialState'));
                    if (!initialState) complain('This tracker has no initialState');
                    sts.push(new $rdf.Statement(issue, ns.rdf('type'), initialState, stateStore))
                    
                    var sendComplete = function(uri, success, body) {
                        if (!success) {
                            dump('Tabulator issue pane: can\'t save new issue:\n\t'+body+'\n')
                        } else {
                            dump('Tabulator issue pane: saved new issue\n')
                            for (var i=0; i< sts.length; i++) {
                                kb.add(sts[i].subject, sts[i].predicate, sts[i].object, sts[i].why);
                            }
                            div.removeChild(form);
                            var plist = [ link ]; // Show the form
                            tabulator.outline.appendPropertyTRs(div, plist, true,
                                function(pred, inverse) {return true;});
                        }
                    }
                    sparqlService.insert_statement(sts, sendComplete);
                }
                form.addEventListener('submit', sendNewIssue, false)
                form.setAttribute('onsubmit', "function xx(){return false;}");
                div.appendChild(form);
                form.innerHTML = "<h2>Add new issue</h2><p>Title of new issue:<p>";
                var titlefield = myDocument.createElement('input')
                titlefield.setAttribute('type','text');
                titlefield.setAttribute('size','100');
                titlefield.setAttribute('maxLength','2048');// No arbitrary limits
                form.appendChild(titlefield);

            }
            var b = myDocument.createElement("button");
            b.setAttribute("type", "button");
            div.appendChild(b)
            b.innerHTML = "New Issue";
            b.addEventListener('click', newIssueForm, false);
            
            // @@ TBD

        }



        // tabulator.outline.appendPropertyTRs(div, plist, true, tabulator.panes.defaultPane.filter)
        /*
        if ((subject.termType == 'symbol' && 
             outline.UserInput.updateService.editMethod(kb.sym(tabulator.rdf.Util.uri.docpart(subject.uri)), kb))
             || (subject.termType == 'bnode' && kb.anyStatementMatching(subject) &&
             outline.UserInput.updateService.editMethod(kb.anyStatementMatching(subject).why)
                //check the document containing something about of the bnode @@ what about as object?
             )) {
            var holdingTr = myDocument.createElement('tr'); //these are to minimize required changes
            var holdingTd = myDocument.createElement('td'); //in userinput.js
            holdingTd.setAttribute('colspan','2');
            holdingTd.setAttribute('notSelectable','true');
            var img = myDocument.createElement('img');
            img.src = tabulator.Icon.src.icon_add_new_triple;
            img.className='bottom-border-active'
            //img.addEventListener('click', thisOutline.UserInput.addNewPredicateObject,false);
            div.appendChild(holdingTr).appendChild(holdingTd).appendChild(img);          
        }
        */       
         
        return div;
    }
}, true);

//ends

