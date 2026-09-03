// compile bin/executable

#include <stdio.h>

int main(int argc, char **argv, char **envp)
{
    for (int i = 0; envp[i] != NULL; ++i) {
        char *entry = envp[i];
        printf("\x1b[33m%s\x1b[0m\n", entry);
    }

    return 0;
}