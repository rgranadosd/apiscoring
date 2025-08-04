# API Scoring Overview - PizzaShackAPI WSO2

This image should show:

## Header
- **Title**: PizzaShackAPI WSO2
- **Subtitle**: API SCORING - FORKED 1.0.26
- **Analysis date**: 04/08/2025, 09:12:37
- **Status**: Adequate (in green)

## Spider Chart (Radar Chart)
A triangular radar chart showing three dimensions:
- **Documentación** (Documentation) - top point
- **Seguridad** (Security) - bottom left point  
- **Diseño** (Design) - bottom right point

The chart shows the API performance across these three areas with connecting lines forming a triangle.

## Scoring Sections
Three expandable sections below the chart:

### DESIGN: 84.29% (Good - in green)
- ⚠️ 415 is not a well-understood HTTP status code
- ⚠️ Missing the post.summary
- ⚠️ Missing the responses[401] http definition

### SECURITY: 76.19% (Good - in green)  
- ⚠️ Schema of type array must specify maxItems
- ⚠️ Response [200] content should contain a body
- ⚠️ "message.maxLength" property must be truthy

### DOCUMENTATION: 0.00%
- Not Applicable (Testing)