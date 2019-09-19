#!/usr/bin/env bash

KEYWORD=$1
LINES_BEFORE=$2
LINES_AFTER=$3
FILE=$4

LINE_NO=$(grep -n $KEYWORD $FILE | sed 's/:.*//' )
echo "Keyword found in line: $LINE_NO"

LINE_START=$(($LINE_NO-$LINES_BEFORE))
LINE_END=$(($LINE_NO+$LINES_AFTER))
echo "Deleting lines $LINE_START to $LINE_END!"

sed -i "$LINE_START,$LINE_END d" $FILE
