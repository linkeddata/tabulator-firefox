all: update
	make -C content all

update:
	git submodule update --init
