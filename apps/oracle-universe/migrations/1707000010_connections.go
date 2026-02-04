package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		humans, err := app.FindCollectionByNameOrId("humans")
		if err != nil {
			return err
		}
		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		// Connections - Human-Oracle relationships
		connections := core.NewBaseCollection("connections")
		connections.Fields.Add(&core.RelationField{
			Name:         "human",
			CollectionId: humans.Id,
			Required:     true,
			MaxSelect:    1,
		})
		connections.Fields.Add(&core.RelationField{
			Name:         "oracle",
			CollectionId: oracles.Id,
			Required:     true,
			MaxSelect:    1,
		})
		connections.Fields.Add(&core.TextField{Name: "type"}) // owner, verifier, collaborator
		connections.Fields.Add(&core.BoolField{Name: "verified"})
		connections.Indexes = append(connections.Indexes, "CREATE UNIQUE INDEX idx_conn_unique ON connections(human, oracle)")
		return app.Save(connections)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("connections")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
