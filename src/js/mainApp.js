import "babel-polyfill";
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Route, Link} from 'react-router-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Paper from 'material-ui/Paper';
import {ListItem} from 'material-ui/List';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Toolbar, ToolbarGroup, ToolbarTitle} from 'material-ui/Toolbar';
import {GridList} from 'material-ui/GridList';
import {Table, TableBody, TableRow, TableRowColumn} from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import DatePicker from 'material-ui/DatePicker';
import moment from 'moment';
import Promise from 'promise-polyfill';
import 'whatwg-fetch';

//Polyfill for fetch on older browsers
if (!window.Promise) {
  window.Promise = Promise;
}

injectTapEventPlugin();

const DATE_FORMAT = 'YYYY-MM-DD';

/*
Application to query and return recently updated Github repos
*/
class App extends Component {
    constructor() {
        super();
        this.state = {
            apiRoot: 'https://api.github.com/search/repositories',
            queryTopic: 'vuejs',
            pushedOperator: '>=',
            pushedDate: this.defaultDateParam(),
            startDate : this.defaultDateParam(),
            sortField : '',
            sortOrder: '',
            queryResults: [],
            resultCount: 0,
            rateExceeded: false,
            //Very simple object array for the info fields.
            //Objects could provide a formatting function to make the dates look nice etc.
            infoFields: [
                {
                    name : 'score',
                    desc : 'Score'
                },
                {
                    name : 'open_issues',
                    desc : 'Issues'
                },
                {
                    name : 'created_at',
                    desc : 'Created'
                },
                {
                    name : 'pushed_at',
                    desc : 'Updated'     
                },
                {
                    name : 'watchers',
                    desc : 'Watchers'                    
                }
            ],
            navLinks: {
                first: '',
                next: '',
                last: '',
                prev: ''
            }
        };
        
        //Bind the functions we'll be using
        this.getAppData = this.getAppData.bind(this);
        this.getQuery = this.getQuery.bind(this);
        this.getInfoFieldElements = this.getInfoFieldElements.bind(this);
        this.defaultDateParam = this.defaultDateParam.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
        this.onPageButtonClick = this.onPageButtonClick.bind(this);
        this.parseLinkHeaders = this.parseLinkHeaders.bind(this);
        
    }
    
    getAppData() {
        //Get the data from the API once the component has mounted
        fetch(this.getQuery(),
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "GET"
            }).then( res => {
                //If we're ok, parse paging links from the link header and the
                //json results
                if ( res.status === 200 ) {
                    let pages = [];
                    let linkHeaders = res.headers.get('link');
                    if ( linkHeaders ) {
                        let links = linkHeaders.split(',');
                        this.parseLinkHeaders(links);
                    } else {
                        let newNavLinks = {first: '', next: '', last: '', prev: ''}
                        this.setState({navLinks:newNavLinks});
                    }
                    
                    res.json().then(
                        res => {
                            if (res.items) {
                                this.setState({queryResults: res.items, resultCount: res.total_count, rateExceeded: false});
                            }
                        }
                    );
                //Otherwise, something's gone wrong. For simplicity we'll assumer it's a rate limit,
                //but normally we'd analyse the status a bit further
                } else {
                    this.setState({rateExceeded: true});
                }
            }, function (error) {
                //Again we'll assume we've tripped the rate limit and set the error panel
                this.setState({rateExceeded: true});
            }
        );                
    }
    
    //Sort out the links in the link header so we can present them in order
    parseLinkHeaders(links) {
        let newNavLinks = {};

        for (let link of links) {
            if ( link.indexOf('next') != -1 ) {
                newNavLinks['next'] = link;
            } else if ( link.indexOf('last') != -1) {
                newNavLinks['last'] = link;
            } else if ( link.indexOf('prev') != -1) {
                newNavLinks['prev'] = link;
            } else if ( link.indexOf('first') != -1) {
                newNavLinks['first'] = link;
            }
        }    
        
        this.setState({navLinks:newNavLinks});
    }
    
    //Return the default start date of the query, i.e. 7 days ago
    defaultDateParam() {
        let startDate = moment();
        startDate.dayOfYear(startDate.dayOfYear() - 7);
        return startDate;
    }
    
    //Function to handle datepicker clicks. Updates the start date and triggers
    //a submit
    onDateChange(event, date) {
        let newDate = moment(date);
        this.setState({startDate: newDate, searchQuery: {}}, function() {
           this.getAppData(); 
        });
    }
    
    //Function to handle the paging link clicks. Updates the search query with the
    //query from the link header and triggers a submit
    onPageButtonClick(link) {
        this.setState({searchQuery:link}, function() {
           this.getAppData(); 
        });
    }
    
    //Composes and returns the query we'll pass to the GitHub API
    getQuery() {
        //See if we have a query from a paging link - ie from the link header - 
        //parse it, and return
        if (this.state.searchQuery && this.state.searchQuery.length > 0) {
            let search = decodeURIComponent(this.state.searchQuery);
            search = search.replace('<', '').substring(0, search.indexOf('>;') - 1);
            return search;
        } else {
            //Otherwise, construct a query from the state params.
            //Query example : https://api.github.com/search/repositories?q=topic:vuejs+pushed:>=2017-12-01&sort=updated&order=desc
            return this.state.apiRoot + '?q=topic:' + this.state.queryTopic 
                + '+pushed:' + this.state.pushedOperator + this.state.startDate.format(DATE_FORMAT)
                + '&' + this.state.sortField + '&' + this.state.sortOrder;
        }
    }
    
    //Returns a ListItem containing the info fields we want to display, e.g. updated date, open issues
    //This could (or maybe should) be a Component, but the nestedItems prop of the ListItem in the GithubRepo component
    //wanted an array so it seemed more convenient to do it like this
    getInfoFieldElements(repo, infoFields, index) {
        return [<Table key={'info-table' + index} children={<TableBody key={'info-table-body' + index} displayRowCheckbox={false} children={
            infoFields.map(
                (infoField) => {
                    //Get the info field index here since we'll need it for keys below
                    let infoFieldIndex = infoFields.indexOf(infoField);
                    return(   
                        <TableRow key={'info-table-' + index + '-row-' + infoFieldIndex} displayBorder={true} children={[
                            <TableRowColumn key={'info-table-' + index + '-row-' + infoFieldIndex + 'col-0'}>{infoField.desc}</TableRowColumn>,
                            <TableRowColumn key={'info-table-' + index + '-row-' + infoFieldIndex + 'col-1'}>{repo[infoField.name]}</TableRowColumn>
                        ]}/>
                    )
                }
            )
        }/> }/>]        
    }
    
    //Call fetch once the root component has mounted
    componentDidMount() {
        this.getAppData();
    }
    
    render() {
        
        //Conditionally return either the app view or an error element if the rate limit has tripped
        let appView;
        
        if ( this.state.rateExceeded ) {
            //This is fugly but at least it gets the message across.
            appView = <span key='rate-limit-error'>Rate Limit exceeded. Please try again in a minute.</span>;
        } else {
            appView =
            <div key='appViewDiv'>
                <GridList key='resultsGrid' cellHeight={'auto'} children={[
                                this.state.queryResults.map( 
                                    (queryResult) => {
                                        return <GithubRepo repo={queryResult} repoIndex={this.state.queryResults.indexOf(queryResult)} infoFields={this.state.infoFields} getInfoFieldElements={this.getInfoFieldElements} />
                                    }
                                )
                        ]}/>
            </div>;
        }        
        
        return(
            <div className="mainApp">
                <BrowserRouter baseName='/'>
                    <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
                        <Paper children={[
                            <AppToolbar key='appToolbar-root' startDate={this.state.startDate} 
                                onDateChange={this.onDateChange} resultCount={this.state.resultCount} 
                                navLinks={this.state.navLinks} onPageButtonClick={this.onPageButtonClick}
                            />,
                            appView
                        ]}/>
                    </MuiThemeProvider>
                </BrowserRouter>
            </div>
        )
    }
}

//Top Level component representing a single GitHub repo
class GithubRepo extends Component {
    constructor() {
        super();
    }
    
    render() {
        return(
            <ListItem className='repo' key={'github-repo-' + this.props.repoIndex } 
                leftAvatar={<img src={this.props.repo.owner.avatar_url} height={20}/>} 
                nestedItems={this.props.getInfoFieldElements(this.props.repo, this.props.infoFields, this.props.repoIndex)}
                children={<RepoInfo repo={this.props.repo} 
                key={'github-repo-info-' + this.props.repoIndex} repoIndex={this.props.repoIndex} /> }
            />
        )
    }
}

//Component for basic information about the Repo, e.g. name, homepage
class RepoInfo extends Component {
    constructor() {
        super();
    }
    
    render() {
        return(
            <div key='repo-info-div'>
                <div className='repo-name'>
                    <span key='repo-info-name'><big><strong>{this.props.repo.name}</strong></big>&nbsp;<small>{this.props.repo.full_name}</small></span>
                </div>
                <div key='repo-info-homepage' className='repo-homepage'>
                    <Link to={{pathname: this.props.repo.homepage}}>{this.props.repo.homepage}</Link>
                </div>
            </div>
        )
    }
}

//Toolbar containing total item count, paging (nav) links and date picker
class AppToolbar extends Component {
    constructor() {
        super();
    }
    
    render() {
        return(
            <Toolbar key='appToolbar'>
                <ToolbarGroup>
                    <ToolbarTitle text='GitVue'/>
                </ToolbarGroup>
                <ToolbarGroup>
                    <div>
                        <span>{this.props.resultCount} repositories found.</span>
                    </div>
                    <div>
                        <Paginator navLinks={this.props.navLinks} onPageButtonClick={this.props.onPageButtonClick}/>
                    </div>
                </ToolbarGroup>
                <ToolbarGroup>
                    <div>
                        <label>from&nbsp;</label>
                    </div>
                    <div>
                        <DatePicker key='toolbar-datepicker' id='toolbar-datepicker' defaultDate={this.props.startDate.toDate()} onChange={this.props.onDateChange} autoOk={true}/>
                    </div>
                </ToolbarGroup>
            </Toolbar>            
        )
    }
}

//Container for the paging links
class Paginator extends Component {
    constructor() {
        super();
    }
    
    render() {
        return(
            <div key='paginator'>
                <PaginationLink link={this.props.navLinks['first']} onPageButtonClick={this.props.onPageButtonClick} />
                <PaginationLink link={this.props.navLinks['prev']} onPageButtonClick={this.props.onPageButtonClick} />
                <PaginationLink link={this.props.navLinks['next']} onPageButtonClick={this.props.onPageButtonClick} /> 
                <PaginationLink link={this.props.navLinks['last']} onPageButtonClick={this.props.onPageButtonClick} /> 
            </div>
        )
    }
}

//Individual paging link component
class PaginationLink extends Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }
    
    handleClick() {
        this.props.onPageButtonClick(this.props.link);
    }
    
    render() {
        let pagingLink = <span>&nbsp;</span>;
        
        if (!this.props.link) {
            return pagingLink;
        }
        
        if ( this.props.link.indexOf('next') != -1 ) {
            pagingLink = <IconButton iconClassName='fa fa-chevron-right' onClick={this.handleClick}/>;
        } else if ( this.props.link.indexOf('last') != -1) {
            pagingLink = <IconButton iconClassName='fa fa-step-forward' onClick={this.handleClick}/>;
        } else if ( this.props.link.indexOf('prev') != -1) {
            pagingLink = <IconButton iconClassName='fa fa-chevron-left' onClick={this.handleClick}/>;
        } else if ( this.props.link.indexOf('first') != -1) {
            pagingLink = <IconButton iconClassName='fa fa-step-backward' onClick={this.handleClick}/>;
        }  
        
        return pagingLink;
    }
}

//This renders the app into the containing element defined in the html file.
ReactDOM.render(
    <App key='gitvue-app'/>,
    document.getElementById( 'root' )
);
