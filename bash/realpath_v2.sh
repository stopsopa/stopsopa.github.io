#
# relative_path FROM TO
#
# Returns the lexical relative path from FROM to TO, similar to:
#
#     Node.js: path.relative(FROM, TO)
#
# Both arguments may be absolute or relative paths. Relative paths are
# resolved against the current working directory.
#
# Examples:
#
#     relative_path "/a/b" "/a/b/c"
#     # c
#
#     relative_path "/a/b/c" "/a/d/e"
#     # ../../d/e
#
#     relative_path "/a/b/c" "/a/b/d"
#     # ../d
#
#     relative_path "/a/b" "/a/b"
#     # .
#
# The implementation is intended to work in minimal POSIX `sh` environments
# and does not depend on Python, Node.js, or `realpath`.
#
# Limitations:
#
# - This is a lexical path operation; symbolic links are not resolved.
# - Absolute paths do not need to exist.
# - Relative paths are resolved using the current working directory.
# - When resolving a relative path, its parent directory must exist because
#   `cd`/`pwd` is used to make it absolute.
# - This implementation is intended for Unix/POSIX paths.
# - Windows drive letters and Windows-style paths are not supported.
#
relative_path() {
    from=$1
    to=$2

    # Make FROM absolute.
    case "$from" in
        /*)
            ;;
        *)
            from=$(cd "$from" 2>/dev/null && pwd) || return 1
            ;;
    esac

    # Make TO absolute.
    case "$to" in
        /*)
            ;;
        *)
            to=$(cd "$(dirname "$to")" 2>/dev/null &&
                printf '%s/%s' "$(pwd)" "$(basename "$to")") || return 1
            ;;
    esac

    # Find common ancestor.
    common=$from

    while [ "$to" != "$common" ]; do
        case "$to" in
            "$common"/*)
                break
                ;;
        esac

        case "$common" in
            /)
                break
                ;;
            */*)
                common=${common%/*}
                ;;
            *)
                common=/
                ;;
        esac
    done

    # Count how many directories we need to go up from FROM.
    result=
    current=$from

    while [ "$current" != "$common" ]; do
        if [ -n "$result" ]; then
            result="../$result"
        else
            result=..
        fi

        case "$current" in
            /)
                break
                ;;
            */*)
                current=${current%/*}
                ;;
            *)
                current=/
                ;;
        esac
    done

    # Add the path from COMMON to TO.
    if [ "$to" != "$common" ]; then
        if [ "$common" = "/" ]; then
            remainder=${to#/}
        else
            remainder=${to#"$common"/}
        fi

        if [ -n "$remainder" ]; then
            if [ -n "$result" ]; then
                result="$result/$remainder"
            else
                result=$remainder
            fi
        fi
    fi

    if [ -n "$result" ]; then
        printf '%s\n' "$result"
    else
        printf '.\n'
    fi
}