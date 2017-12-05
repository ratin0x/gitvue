'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactRouterDom = require('react-router-dom');

var _MuiThemeProvider = require('material-ui/styles/MuiThemeProvider');

var _MuiThemeProvider2 = _interopRequireDefault(_MuiThemeProvider);

var _reactTapEventPlugin = require('react-tap-event-plugin');

var _reactTapEventPlugin2 = _interopRequireDefault(_reactTapEventPlugin);

var _Paper = require('material-ui/Paper');

var _Paper2 = _interopRequireDefault(_Paper);

var _List = require('material-ui/List');

var _lightBaseTheme = require('material-ui/styles/baseThemes/lightBaseTheme');

var _lightBaseTheme2 = _interopRequireDefault(_lightBaseTheme);

var _getMuiTheme = require('material-ui/styles/getMuiTheme');

var _getMuiTheme2 = _interopRequireDefault(_getMuiTheme);

var _Toolbar = require('material-ui/Toolbar');

var _GridList = require('material-ui/GridList');

var _Table = require('material-ui/Table');

var _IconButton = require('material-ui/IconButton');

var _IconButton2 = _interopRequireDefault(_IconButton);

var _DatePicker = require('material-ui/DatePicker');

var _DatePicker2 = _interopRequireDefault(_DatePicker);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _promisePolyfill = require('promise-polyfill');

var _promisePolyfill2 = _interopRequireDefault(_promisePolyfill);

require('whatwg-fetch');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//Polyfill for fetch on older browsers
if (!window.Promise) {
    window.Promise = _promisePolyfill2.default;
}

(0, _reactTapEventPlugin2.default)();

var DATE_FORMAT = 'YYYY-MM-DD';

/*
Application to query and return recently updated Github repos
*/

var App = function (_Component) {
    _inherits(App, _Component);

    function App() {
        _classCallCheck(this, App);

        var _this = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this));

        _this.state = {
            apiRoot: 'https://api.github.com/search/repositories',
            queryTopic: 'vuejs',
            pushedOperator: '>=',
            pushedDate: _this.defaultDateParam(),
            startDate: _this.defaultDateParam(),
            sortField: '',
            sortOrder: '',
            queryResults: [],
            resultCount: 0,
            rateExceeded: false,
            //Very simple object array for the info fields.
            //Objects could provide a formatting function to make the dates look nice etc.
            infoFields: [{
                name: 'score',
                desc: 'Score'
            }, {
                name: 'open_issues',
                desc: 'Issues'
            }, {
                name: 'created_at',
                desc: 'Created'
            }, {
                name: 'pushed_at',
                desc: 'Updated'
            }, {
                name: 'watchers',
                desc: 'Watchers'
            }],
            navLinks: {
                first: '',
                next: '',
                last: '',
                prev: ''
            }
        };

        //Bind the functions we'll be using
        _this.getAppData = _this.getAppData.bind(_this);
        _this.getQuery = _this.getQuery.bind(_this);
        _this.getInfoFieldElements = _this.getInfoFieldElements.bind(_this);
        _this.defaultDateParam = _this.defaultDateParam.bind(_this);
        _this.onDateChange = _this.onDateChange.bind(_this);
        _this.onPageButtonClick = _this.onPageButtonClick.bind(_this);
        _this.parseLinkHeaders = _this.parseLinkHeaders.bind(_this);

        return _this;
    }

    _createClass(App, [{
        key: 'getAppData',
        value: function getAppData() {
            var _this2 = this;

            //Get the data from the API once the component has mounted
            fetch(this.getQuery(), {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "GET"
            }).then(function (res) {
                //If we're ok, parse paging links from the link header and the
                //json results
                if (res.status === 200) {
                    var pages = [];
                    var linkHeaders = res.headers.get('link');
                    if (linkHeaders) {
                        var links = linkHeaders.split(',');
                        _this2.parseLinkHeaders(links);
                    } else {
                        var newNavLinks = { first: '', next: '', last: '', prev: '' };
                        _this2.setState({ navLinks: newNavLinks });
                    }

                    res.json().then(function (res) {
                        if (res.items) {
                            _this2.setState({ queryResults: res.items, resultCount: res.total_count, rateExceeded: false });
                        }
                    });
                    //Otherwise, something's gone wrong. For simplicity we'll assumer it's a rate limit,
                    //but normally we'd analyse the status a bit further
                } else {
                    _this2.setState({ rateExceeded: true });
                }
            }, function (error) {
                //Again we'll assume we've tripped the rate limit and set the error panel
                this.setState({ rateExceeded: true });
            });
        }

        //Sort out the links in the link header so we can present them in order

    }, {
        key: 'parseLinkHeaders',
        value: function parseLinkHeaders(links) {
            var newNavLinks = {};

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = links[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var link = _step.value;

                    if (link.indexOf('next') != -1) {
                        newNavLinks['next'] = link;
                    } else if (link.indexOf('last') != -1) {
                        newNavLinks['last'] = link;
                    } else if (link.indexOf('prev') != -1) {
                        newNavLinks['prev'] = link;
                    } else if (link.indexOf('first') != -1) {
                        newNavLinks['first'] = link;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.setState({ navLinks: newNavLinks });
        }

        //Return the default start date of the query, i.e. 7 days ago

    }, {
        key: 'defaultDateParam',
        value: function defaultDateParam() {
            var startDate = (0, _moment2.default)();
            startDate.dayOfYear(startDate.dayOfYear() - 7);
            return startDate;
        }

        //Function to handle datepicker clicks. Updates the start date and triggers
        //a submit

    }, {
        key: 'onDateChange',
        value: function onDateChange(event, date) {
            var newDate = (0, _moment2.default)(date);
            this.setState({ startDate: newDate, searchQuery: {} }, function () {
                this.getAppData();
            });
        }

        //Function to handle the paging link clicks. Updates the search query with the
        //query from the link header and triggers a submit

    }, {
        key: 'onPageButtonClick',
        value: function onPageButtonClick(link) {
            this.setState({ searchQuery: link }, function () {
                this.getAppData();
            });
        }

        //Composes and returns the query we'll pass to the GitHub API

    }, {
        key: 'getQuery',
        value: function getQuery() {
            //See if we have a query from a paging link - ie from the link header - 
            //parse it, and return
            if (this.state.searchQuery && this.state.searchQuery.length > 0) {
                var search = decodeURIComponent(this.state.searchQuery);
                search = search.replace('<', '').substring(0, search.indexOf('>;') - 1);
                return search;
            } else {
                //Otherwise, construct a query from the state params.
                //Query example : https://api.github.com/search/repositories?q=topic:vuejs+pushed:>=2017-12-01&sort=updated&order=desc
                return this.state.apiRoot + '?q=topic:' + this.state.queryTopic + '+pushed:' + this.state.pushedOperator + this.state.startDate.format(DATE_FORMAT) + '&' + this.state.sortField + '&' + this.state.sortOrder;
            }
        }

        //Returns a ListItem containing the info fields we want to display, e.g. updated date, open issues
        //This could (or maybe should) be a Component, but the nestedItems prop of the ListItem in the GithubRepo component
        //wanted an array so it seemed more convenient to do it like this

    }, {
        key: 'getInfoFieldElements',
        value: function getInfoFieldElements(repo, infoFields, index) {
            return [_react2.default.createElement(_Table.Table, { key: 'info-table' + index, children: _react2.default.createElement(_Table.TableBody, { key: 'info-table-body' + index, displayRowCheckbox: false, children: infoFields.map(function (infoField) {
                        //Get the info field index here since we'll need it for keys below
                        var infoFieldIndex = infoFields.indexOf(infoField);
                        return _react2.default.createElement(_Table.TableRow, { key: 'info-table-' + index + '-row-' + infoFieldIndex, displayBorder: true, children: [_react2.default.createElement(
                                _Table.TableRowColumn,
                                { key: 'info-table-' + index + '-row-' + infoFieldIndex + 'col-0' },
                                infoField.desc
                            ), _react2.default.createElement(
                                _Table.TableRowColumn,
                                { key: 'info-table-' + index + '-row-' + infoFieldIndex + 'col-1' },
                                repo[infoField.name]
                            )] });
                    }) }) })];
        }

        //Call fetch once the root component has mounted

    }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.getAppData();
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            //Conditionally return either the app view or an error element if the rate limit has tripped
            var appView = void 0;

            if (this.state.rateExceeded) {
                //This is fugly but at least it gets the message across.
                appView = _react2.default.createElement(
                    'span',
                    { key: 'rate-limit-error' },
                    'Rate Limit exceeded. Please try again in a minute.'
                );
            } else {
                appView = _react2.default.createElement(
                    'div',
                    { key: 'appViewDiv' },
                    _react2.default.createElement(_GridList.GridList, { key: 'resultsGrid', cellHeight: 'auto', children: [this.state.queryResults.map(function (queryResult) {
                            return _react2.default.createElement(GithubRepo, { repo: queryResult, repoIndex: _this3.state.queryResults.indexOf(queryResult), infoFields: _this3.state.infoFields, getInfoFieldElements: _this3.getInfoFieldElements });
                        })] })
                );
            }

            return _react2.default.createElement(
                'div',
                { className: 'mainApp' },
                _react2.default.createElement(
                    _reactRouterDom.BrowserRouter,
                    { baseName: '/' },
                    _react2.default.createElement(
                        _MuiThemeProvider2.default,
                        { muiTheme: (0, _getMuiTheme2.default)(_lightBaseTheme2.default) },
                        _react2.default.createElement(_Paper2.default, { children: [_react2.default.createElement(AppToolbar, { key: 'appToolbar-root', startDate: this.state.startDate,
                                onDateChange: this.onDateChange, resultCount: this.state.resultCount,
                                navLinks: this.state.navLinks, onPageButtonClick: this.onPageButtonClick
                            }), appView] })
                    )
                )
            );
        }
    }]);

    return App;
}(_react.Component);

//Top Level component representing a single GitHub repo


var GithubRepo = function (_Component2) {
    _inherits(GithubRepo, _Component2);

    function GithubRepo() {
        _classCallCheck(this, GithubRepo);

        return _possibleConstructorReturn(this, (GithubRepo.__proto__ || Object.getPrototypeOf(GithubRepo)).call(this));
    }

    _createClass(GithubRepo, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(_List.ListItem, { className: 'repo', key: 'github-repo-' + this.props.repoIndex,
                leftAvatar: _react2.default.createElement('img', { src: this.props.repo.owner.avatar_url, height: 20 }),
                nestedItems: this.props.getInfoFieldElements(this.props.repo, this.props.infoFields, this.props.repoIndex),
                children: _react2.default.createElement(RepoInfo, { repo: this.props.repo,
                    key: 'github-repo-info-' + this.props.repoIndex, repoIndex: this.props.repoIndex })
            });
        }
    }]);

    return GithubRepo;
}(_react.Component);

//Component for basic information about the Repo, e.g. name, homepage


var RepoInfo = function (_Component3) {
    _inherits(RepoInfo, _Component3);

    function RepoInfo() {
        _classCallCheck(this, RepoInfo);

        return _possibleConstructorReturn(this, (RepoInfo.__proto__ || Object.getPrototypeOf(RepoInfo)).call(this));
    }

    _createClass(RepoInfo, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                { key: 'repo-info-div' },
                _react2.default.createElement(
                    'div',
                    { className: 'repo-name' },
                    _react2.default.createElement(
                        'span',
                        { key: 'repo-info-name' },
                        _react2.default.createElement(
                            'big',
                            null,
                            _react2.default.createElement(
                                'strong',
                                null,
                                this.props.repo.name
                            )
                        ),
                        '\xA0',
                        _react2.default.createElement(
                            'small',
                            null,
                            this.props.repo.full_name
                        )
                    )
                ),
                _react2.default.createElement(
                    'div',
                    { key: 'repo-info-homepage', className: 'repo-homepage' },
                    _react2.default.createElement(
                        _reactRouterDom.Link,
                        { to: { pathname: this.props.repo.homepage } },
                        this.props.repo.homepage
                    )
                )
            );
        }
    }]);

    return RepoInfo;
}(_react.Component);

//Toolbar containing total item count, paging (nav) links and date picker


var AppToolbar = function (_Component4) {
    _inherits(AppToolbar, _Component4);

    function AppToolbar() {
        _classCallCheck(this, AppToolbar);

        return _possibleConstructorReturn(this, (AppToolbar.__proto__ || Object.getPrototypeOf(AppToolbar)).call(this));
    }

    _createClass(AppToolbar, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                _Toolbar.Toolbar,
                { key: 'appToolbar' },
                _react2.default.createElement(
                    _Toolbar.ToolbarGroup,
                    null,
                    _react2.default.createElement(_Toolbar.ToolbarTitle, { text: 'GitVue' })
                ),
                _react2.default.createElement(
                    _Toolbar.ToolbarGroup,
                    null,
                    _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement(
                            'span',
                            null,
                            this.props.resultCount,
                            ' repositories found.'
                        )
                    ),
                    _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement(Paginator, { navLinks: this.props.navLinks, onPageButtonClick: this.props.onPageButtonClick })
                    )
                ),
                _react2.default.createElement(
                    _Toolbar.ToolbarGroup,
                    null,
                    _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement(
                            'label',
                            null,
                            'from\xA0'
                        )
                    ),
                    _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement(_DatePicker2.default, { key: 'toolbar-datepicker', id: 'toolbar-datepicker', defaultDate: this.props.startDate.toDate(), onChange: this.props.onDateChange, autoOk: true })
                    )
                )
            );
        }
    }]);

    return AppToolbar;
}(_react.Component);

//Container for the paging links


var Paginator = function (_Component5) {
    _inherits(Paginator, _Component5);

    function Paginator() {
        _classCallCheck(this, Paginator);

        return _possibleConstructorReturn(this, (Paginator.__proto__ || Object.getPrototypeOf(Paginator)).call(this));
    }

    _createClass(Paginator, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                { key: 'paginator' },
                _react2.default.createElement(PaginationLink, { link: this.props.navLinks['first'], onPageButtonClick: this.props.onPageButtonClick }),
                _react2.default.createElement(PaginationLink, { link: this.props.navLinks['prev'], onPageButtonClick: this.props.onPageButtonClick }),
                _react2.default.createElement(PaginationLink, { link: this.props.navLinks['next'], onPageButtonClick: this.props.onPageButtonClick }),
                _react2.default.createElement(PaginationLink, { link: this.props.navLinks['last'], onPageButtonClick: this.props.onPageButtonClick })
            );
        }
    }]);

    return Paginator;
}(_react.Component);

//Individual paging link component


var PaginationLink = function (_Component6) {
    _inherits(PaginationLink, _Component6);

    function PaginationLink() {
        _classCallCheck(this, PaginationLink);

        var _this8 = _possibleConstructorReturn(this, (PaginationLink.__proto__ || Object.getPrototypeOf(PaginationLink)).call(this));

        _this8.handleClick = _this8.handleClick.bind(_this8);
        return _this8;
    }

    _createClass(PaginationLink, [{
        key: 'handleClick',
        value: function handleClick() {
            this.props.onPageButtonClick(this.props.link);
        }
    }, {
        key: 'render',
        value: function render() {
            var pagingLink = _react2.default.createElement(
                'span',
                null,
                '\xA0'
            );

            if (!this.props.link) {
                return pagingLink;
            }

            if (this.props.link.indexOf('next') != -1) {
                pagingLink = _react2.default.createElement(_IconButton2.default, { iconClassName: 'fa fa-chevron-right', onClick: this.handleClick });
            } else if (this.props.link.indexOf('last') != -1) {
                pagingLink = _react2.default.createElement(_IconButton2.default, { iconClassName: 'fa fa-step-forward', onClick: this.handleClick });
            } else if (this.props.link.indexOf('prev') != -1) {
                pagingLink = _react2.default.createElement(_IconButton2.default, { iconClassName: 'fa fa-chevron-left', onClick: this.handleClick });
            } else if (this.props.link.indexOf('first') != -1) {
                pagingLink = _react2.default.createElement(_IconButton2.default, { iconClassName: 'fa fa-step-backward', onClick: this.handleClick });
            }

            return pagingLink;
        }
    }]);

    return PaginationLink;
}(_react.Component);

//This renders the app into the containing element defined in the html file.


_reactDom2.default.render(_react2.default.createElement(App, { key: 'gitvue-app' }), document.getElementById('root'));
//# sourceMappingURL=mainApp.js.map