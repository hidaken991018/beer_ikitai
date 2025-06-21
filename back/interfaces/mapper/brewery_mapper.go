package mapper

import (
	"mybeerlog/domain/entity"
	"mybeerlog/interfaces/dto"
)

func BreweryEntityToResponse(e *entity.Brewery) *dto.BreweryResponse {
	if e == nil {
		return nil
	}
	
	return &dto.BreweryResponse{
		ID:          e.ID,
		Name:        e.Name,
		Address:     e.Address,
		Description: e.Description,
		Latitude:    e.Latitude,
		Longitude:   e.Longitude,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}

func BreweryEntityToPublicResponse(e *entity.Brewery) *dto.BreweryPublicResponse {
	if e == nil {
		return nil
	}
	
	return &dto.BreweryPublicResponse{
		ID:          e.ID,
		Name:        e.Name,
		Address:     e.Address,
		Description: e.Description,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}

func BreweryEntitiesToResponses(entities []*entity.Brewery) []*dto.BreweryResponse {
	responses := make([]*dto.BreweryResponse, len(entities))
	for i, e := range entities {
		responses[i] = BreweryEntityToResponse(e)
	}
	return responses
}

func BreweryEntitiesToPublicResponses(entities []*entity.Brewery) []*dto.BreweryPublicResponse {
	responses := make([]*dto.BreweryPublicResponse, len(entities))
	for i, e := range entities {
		responses[i] = BreweryEntityToPublicResponse(e)
	}
	return responses
}