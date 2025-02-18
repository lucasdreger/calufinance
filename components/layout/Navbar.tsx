import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import BudgetPlans from './components/BudgetPlans';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Fixed Expense Plans', href: '/budget-plans' },
];

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            {navigation.map((item) => (
              <li key={item.name}>
                <a href={item.href}>{item.name}</a>
              </li>
            ))}
          </ul>
        </nav>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/budget-plans" component={BudgetPlans} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
