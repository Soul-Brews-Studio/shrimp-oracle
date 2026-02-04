package main

import (
	"log"
	"os"

	"oracle-universe/hooks"
	_ "oracle-universe/migrations"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	// Enable auto migrations
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true,
	})

	// Register hooks and routes
	hooks.RegisterHooks(app)
	hooks.RegisterSIWE(app)

	// Start the server
	if err := app.Start(); err != nil {
		log.Fatal(err)
		os.Exit(1)
	}
}
