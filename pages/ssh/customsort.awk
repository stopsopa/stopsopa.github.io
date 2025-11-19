# customsort.awk

BEGIN {
    while ((getline line < prior) > 0)
        priority[line] = ++i
}

{
    # extract last path component
    n = split($0, parts, "/")
    file = parts[n]

    rank = (file in priority ? priority[file] : 99999)

    print rank, $0
}
