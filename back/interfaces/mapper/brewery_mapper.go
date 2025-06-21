package mapper

import (
	"mybeerlog/domain/entity"
	"mybeerlog/interfaces/dto"
)

// BreweryEntityToResponse 醸造所エンティティをレスポンスDTOに変換する
func BreweryEntityToResponse(e *entity.Brewery) *dto.BreweryResponse {
	if e == nil {
		return nil
	}
	
	return &dto.BreweryResponse{
		ID:          e.ID(),
		Name:        e.Name(),
		Address:     e.Address(),
		Description: e.Description(),
		Latitude:    e.Latitude(),
		Longitude:   e.Longitude(),
		CreatedAt:   e.CreatedAt(),
		UpdatedAt:   e.UpdatedAt(),
	}
}

// BreweryEntityToPublicResponse 醸造所エンティティをパブリックレスポンスDTOに変換する
func BreweryEntityToPublicResponse(e *entity.Brewery) *dto.BreweryPublicResponse {
	if e == nil {
		return nil
	}
	
	return &dto.BreweryPublicResponse{
		ID:          e.ID(),
		Name:        e.Name(),
		Address:     e.Address(),
		Description: e.Description(),
		CreatedAt:   e.CreatedAt(),
		UpdatedAt:   e.UpdatedAt(),
	}
}

// BreweryEntitiesToResponses 醸造所エンティティの配列をレスポンスDTOの配列に変換する
func BreweryEntitiesToResponses(entities []*entity.Brewery) []*dto.BreweryResponse {
	responses := make([]*dto.BreweryResponse, len(entities))
	for i, e := range entities {
		responses[i] = BreweryEntityToResponse(e)
	}
	return responses
}

// BreweryEntitiesToPublicResponses 醸造所エンティティの配列をパブリックレスポンスDTOの配列に変換する
func BreweryEntitiesToPublicResponses(entities []*entity.Brewery) []*dto.BreweryPublicResponse {
	responses := make([]*dto.BreweryPublicResponse, len(entities))
	for i, e := range entities {
		responses[i] = BreweryEntityToPublicResponse(e)
	}
	return responses
}