export MAMBA_ROOT_PREFIX="/home/iven/igb-design-center/yes"
__mamba_setup="$("/home/iven/igb-design-center/yes/bin/mamba" shell hook --shell posix 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__mamba_setup"
else
    alias mamba="/home/iven/igb-design-center/yes/bin/mamba"  # Fallback on help from mamba activate
fi
unset __mamba_setup
