MANUAL INSTALLATION:
to install the wings addon please setup a wings dev environment first.
I will NOT provide support for this, as its an optional part of the addon.

Copy router_server_versions.go to router/

Open router/router.go
Add

server.GET("/version", getInstalledVersion)

After

server.DELETE("", deleteServer)

and rebuild wings, deploy it to your nodes.
There is no additional config needed on the addon itself.


LAZY INSTALLATION:
in case you do not use any other addons except mine that require wings modifications,
you can use my precompiled wings artifacts from https://github.com/0x7d8/wings

# Do this after installing wings normally, run this when you Need to update wings, not the official docs method
curl -L -o /tmp/wings.zip "https://nightly.link/0x7d8/wings/workflows/push.yaml/develop/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64").zip"
sudo unzip -o /tmp/wings.zip -d /usr/local/bin
sudo chmod u+x /usr/local/bin/wings
rm /tmp/wings.zip
systemctl restart wings