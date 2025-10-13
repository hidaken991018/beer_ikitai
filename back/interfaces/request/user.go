package request

type CreateUserProfile struct {
	DisplayName string `json:"display_name"`
	IconURL     string `json:"icon_url"`
}
