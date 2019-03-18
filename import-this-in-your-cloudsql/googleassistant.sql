-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 19, 2019 at 01:39 AM
-- Server version: 5.7.25-0ubuntu0.18.04.2
-- PHP Version: 7.2.16-1+ubuntu18.04.1+deb.sury.org+1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `upwork_googleassistant`
--

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(10) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `email`, `role`) VALUES
(1, 'ex@example.com.com', 'admin'),
(2, 'admin1@gmail.com', 'admin'),
(3, 'employee1@example.com', 'user'),
(4, 'employee2@example.com', 'user'),
(5, 'employee3@gmail.com', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(10) NOT NULL,
  `emp_id` bigint(20) NOT NULL,
  `amount` float NOT NULL,
  `status` enum('approved','pending') NOT NULL DEFAULT 'pending',
  `submited_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_on` datetime DEFAULT NULL,
  `body` text,
  `pdf` text,
  `xls` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `emp_id`, `amount`, `status`, `submited_on`, `approved_on`, `body`, `pdf`, `xls`) VALUES
(1, 2, 100, 'pending', '2019-03-16 13:42:56', NULL, '1', '2', '3'),
(2, 3, 567, 'pending', '2019-03-16 13:43:20', NULL, '1', '2', '3'),
(3, 3, 456, 'pending', '2019-03-17 12:44:06', NULL, NULL, NULL, NULL),
(4, 1, 67, 'pending', '2019-03-17 12:44:38', NULL, NULL, NULL, NULL),
(5, 1, 4561, 'approved', '2019-03-17 12:45:06', NULL, NULL, NULL, NULL),
(6, 1, 123, 'pending', '2019-03-17 12:45:48', NULL, NULL, NULL, NULL),
(7, 2, 890, 'approved', '2019-03-17 12:46:10', NULL, NULL, NULL, NULL),
(8, 2, 34, 'approved', '2019-03-17 12:46:29', NULL, NULL, NULL, NULL),
(9, 3, 4256, 'approved', '2019-03-17 12:46:51', NULL, NULL, NULL, NULL);

--
-- Triggers `expenses`
--
DELIMITER $$
CREATE TRIGGER `update_aproved_on` BEFORE UPDATE ON `expenses` FOR EACH ROW BEGIN
     IF NOT(NEW.status <=> OLD.status) THEN
    			SET NEW.approved_on= IF(NEW.status = 'approved' ,CURRENT_TIMESTAMP,NULL);
 
   		 

	END IF;
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `emp_email` (`email`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_emp_id` (`emp_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employees` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
