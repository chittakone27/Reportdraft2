# DHIS2 standard report development environment

## How to use:

1.  Run `yarn install` and `yarn add react react-dom recoil` in the root directory.

2.  Create `.env` file in root directory with content as following example:

        VITE_FONT=<base font>
        VITE_MODE=development
        VITE_BASE_URL=<dhis2 base url>
        VITE_USERNAME=<dhis2 username>
        VITE_PASSWORD=<dhis2 password>
        VITE_REPORT_ID=<dhis2 standard report uid>

3.  Create your report inside `./src/reports/` folder
4.  Go to `./src/App.jsx` and include the report
5.  Run `yarn start` for development
yarn build
6.  To deploy the report to DHIS2, run `yarn deploy`
