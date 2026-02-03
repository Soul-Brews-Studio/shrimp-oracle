package main

import (
	"log"
	"os"

	_ "agent-net/hooks"
	_ "agent-net/migrations"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	// Enable auto migrations
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true,
	})

	// Start the server
	if err := app.Start(); err != nil {
		log.Fatal(err)
		os.Exit(1)
	}
}
