#
# DEVELOPMENT CONTAINER
#
FROM ubuntu:22.10

ARG PROJECT=hfu
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# System update and setup
ENV DEBIAN_FRONTEND=noninteractive
RUN ln -fs /usr/share/zoneinfo/Europe/Berlin /etc/localtime
RUN apt-get update
RUN apt-get install -y apt-utils
RUN apt-get install -y locales tzdata
RUN locale-gen en_US.UTF-8
RUN apt-get upgrade -y
RUN apt-get install -y software-properties-common curl sudo

# Add additional repositories
# fish shell
RUN apt-add-repository -y ppa:fish-shell/release-3
RUN apt-get update
# nodejs v18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Use local user "vscode" instead of root
# See https://aka.ms/vscode-remote/containers/non-root
RUN groupadd --gid $USER_GID $USERNAME
RUN useradd --uid $USER_UID --gid $USER_GID -m $USERNAME
RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME
RUN chmod 0440 /etc/sudoers.d/$USERNAME

# Install fish shell
RUN apt-get install -y fish
RUN usermod --shell /usr/bin/fish $USERNAME

# Install development tools
RUN apt-get install -y git
RUN apt-get install -y neovim
RUN apt-get install -y glslang-tools
RUN apt-get install -y nodejs

# apt cleanup
RUN apt-get autoclean

# Update npm
RUN npm install -g npm

# Run as non-root user
USER $USERNAME

# Ensure the .config and .local folder exists, because we want to mount into it
RUN mkdir /home/$USERNAME/.config/
RUN mkdir -p /home/$USERNAME/.local/share/

# Setup git
RUN git config --global user.name "Clemens Sielaff"
RUN git config --global user.email "git@clemens-sielaff.com"

# Tell git to use VSCode as the default editor
RUN git config --global diff.tool vscode
RUN git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'
RUN git config --global merge.tool vscode
RUN git config --global mergetool.vscode.cmd 'code --wait --merge $REMOTE $LOCAL $BASE $MERGED'

# Put the .local/bin folder into the PATH
ENV PATH="/home/$USERNAME/.local/bin:${PATH}"
