package mapper

import (
	"mybeerlog/domain/entity"
	"mybeerlog/interfaces/dto"
)

func VisitEntityToResponse(e *entity.Visit) *dto.VisitResponse {
	if e == nil {
		return nil
	}

	response := &dto.VisitResponse{
		ID:            e.ID,
		UserProfileID: *e.UserProfileID,
		BreweryID:     *e.BreweryID,
		VisitedAt:     e.VisitedAt,
	}

	if e.Brewery != nil {
		response.Brewery = BreweryEntityToResponse(e.Brewery)
	}

	return response
}

func VisitEntitiesToResponses(entities []*entity.Visit) []*dto.VisitResponse {
	responses := make([]*dto.VisitResponse, len(entities))
	for i, e := range entities {
		responses[i] = VisitEntityToResponse(e)
	}
	return responses
}
