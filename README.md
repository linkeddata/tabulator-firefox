Tabulator Firefox
=================

Linked Data Browser, for Firefox

How Do I Install Tabulator
==========================

One way to install tabulator is as a firefox extension.  This involves downloading and making the source then putting a line in your extensions directory.

    git clone --recursive  https://github.com/linkeddata/tabulator-firefox.git
    cd tabulator-firefox
    make
    for i in ~/.mozilla/firefox/*/extensions/ ; do echo $PWD > $i/tabulator@csail.mit.edu ; done
