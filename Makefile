all: update
	make -C content all

update:
	git submodule update --init

status:
	@pwd
	@git branch -v
	@git status -s
	@make -C content status


install: update
	for i in ~/.mozilla/firefox/*/extensions/ ; do echo $$PWD > $$i/tabulator@csail.mit.edu ; done

detach:
	git checkout origin/master
	git reset --hard HEAD

#   WARNING  .. don't do this if you have uncommitted local changes
#
gh-pages: detach
	git branch -D gh-pages ||:
	git checkout -b gh-pages
	git commit -m 'gh-pages: update to latest'  ||: 
	git push -f origin gh-pages
	git checkout master
