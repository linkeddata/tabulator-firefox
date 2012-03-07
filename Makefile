all: update
	make -C content all

update:
	git submodule update --init

status:
	@pwd
	@git branch -v
	@git status -s
	@make -C content status
