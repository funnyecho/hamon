PROJECT := hamon

BUILD_DIST := dist/

clean-build:
	@rm -rf ${BUILD_DIST};
	
build: clean-build
	tsc
	
test:
	@npm test
	
test-coverage:
	@npm test:coverage
	
api-extract: build
	@api-extractor run --local --verbose -c scripts/api-extractor/config.json
	
api-document: api-extract
	 @api-documenter markdown -i ./api_report_local -o ./docs